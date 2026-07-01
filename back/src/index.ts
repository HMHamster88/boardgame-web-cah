
import type { GameBackService } from 'boardgame-web-common/back'
import { CahGameBackService } from './cahBackService'
import questionsImport from './texts/questions'
import answersImport from './texts/answers'
export * from './types'
export const questions = questionsImport
export const answers = answersImport


export function getGameBackService(): GameBackService {
    return new CahGameBackService()
}