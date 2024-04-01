import { Semaphore } from 'async-mutex'
import { Document } from 'langchain/document'
import { StringOutputParser } from '@langchain/core/output_parsers'
import {
  Runnable,
  RunnableConfig,
  RunnableSequence,
} from '@langchain/core/runnables'
import { BaseMessageChunk } from '@langchain/core/messages'
import { IntergrationLlm } from '../llm'
import { choicePrompt } from '../prompt'
import {
  adjustConcurrencyByPaymentStatus,
  adjustRetriesByPaymentStatus,
  removePrefixNumbers,
  isLegalQuestionStructure,
  splitQuestions,
} from './util'
import { documentHandler, fileHandler } from '@/lib/db-handler'
import { questionHandler } from '@/lib/db-handler/question'
import type { TProfile } from '@prisma/client'
import type { PromptType, QuestionType, RoleType } from '@/types/global'

export class Chain {
  profile: TProfile
  semaphore: Semaphore
  noteId: number
  fileId: number
  filename: string
  questionType: QuestionType
  promptType: PromptType
  temperature: number
  streaming: boolean
  questionCount: number
  chain: RunnableSequence<any, string>

  constructor(
    profile: TProfile,
    noteId: number,
    fileId: number,
    filename: string,
    questionType: QuestionType,
    promptType: PromptType,
    temperature: number = 0,
    streaming: boolean = false
  ) {
    this.profile = profile
    this.semaphore = new Semaphore(adjustConcurrencyByPaymentStatus())
    this.noteId = noteId
    this.fileId = fileId
    this.filename = filename
    this.promptType = promptType
    this.temperature = temperature
    this.streaming = streaming
    this.questionCount = 0
    this.questionType = questionType
    this.chain = this.initChain(questionType)
  }

  private initChain(questionType: QuestionType) {
    const { currentRole } = this.profile
    const llmInstance = new IntergrationLlm(this.profile, {
      temperature: this.temperature,
      streaming: this.streaming,
      maxRetries: adjustRetriesByPaymentStatus(),
      verbose: false,
    })
    const prompt = choicePrompt(
      this.promptType,
      currentRole as RoleType,
      questionType
    )

    const outputParser = new StringOutputParser()

    const chain = RunnableSequence.from([
      prompt,
      llmInstance.llm!,
      outputParser,
    ])

    return chain
  }

  public async generateQuestions(docs: Document[]): Promise<number> {
    try {
      for (const doc of docs) {
        const { id: documentId } = await documentHandler.create(
          this.noteId,
          this.fileId,
          this.filename,
          doc.pageContent
        )
        await this._generateQuestions(doc, documentId)
      }
    } catch (e) {
      fileHandler.update(this.fileId, { isUploading: '0' })
      throw e
    }

    return this.questionCount
  }

  private async _generateQuestions(doc: Document, docId: number) {
    const res = await this.chain.invoke({
      title: this.filename,
      context: doc.pageContent,
    })

    for (const question of splitQuestions(res, this.questionType)) {
      if (!isLegalQuestionStructure(question, this.questionType)) continue
      const { currentRole } = this.profile
      questionHandler.create(
        docId,
        this.questionType,
        removePrefixNumbers(question),
        currentRole
      )

      this.questionCount += 1
    }
  }
}
