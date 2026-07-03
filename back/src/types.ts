import type { GameAction, GamePrivateState, GamePublicState, GameSettings, PlayerPrivateState, PlayerPublicState } from "boardgame-web-common";


export const cahPlayerCardsCount = 10

export interface CahGameSettings extends GameSettings {
    pointsToWin: number
    voteMode: boolean
}

export interface CahPublicPlayerState extends PlayerPublicState {
    points: number | null
}

export enum CahGamePhase {
    PLAYERS_CHOOSE_ANSWERS,
    VOTING_FOR_ANSWERS,
    SHOW_ROUND_RESULTS
}

export interface PlayerAnswers {
    playerId: string,
    answersIds: number[],
    playerVotes: string[]
}

export interface CahGamePublicState extends GamePublicState {
    phase: CahGamePhase
    questionCardId: number
    playersSlectedAswers: PlayerAnswers[]
    playersStates: CahPublicPlayerState[],
}

export interface CahPrivatePlayerState extends PlayerPrivateState {
    onHandAswersIds: number[]
}

export interface CahGamePrivateState extends GamePrivateState {
    playersStates: CahPrivatePlayerState[]

    questionDeck: number[]
    answerDeck: number[]

    questionDiscardPile: number[]
    answerDiscardPile: number[]
}

export interface CahSendAnswersAction extends GameAction {
    type: 'CahSendAnswersAction'
    answersIds: number[]
}

export interface CahVoteForAnswerAction extends GameAction {
    type: 'CahVoteForAnswerAction'
    playerId: string
}

export interface CahDrawCardsAction extends GameAction {
    type: 'CahDrawCardsAction'
}

export interface EndRoundAction extends GameAction {
    type: 'EndRoundAction'
}

export enum WordCase {
    NOMINATIVE_CASE = "NOMINATIVE_CASE", // Именительный Есть Кто? Что? Кот, книга
    GENITIVE_CASE = "GENITIVE_CASE", // Родительный Нет Кого? Чего? Кота, книги
    DATIVE_CASE = "DATIVE_CASE", // Дательный Дать Кому? Чему? Коту, книге
    ACCUSATIVE_CASE = "ACCUSATIVE_CASE", // Винительный Вижу Кого? Что? Кота, книгу
    INSTRUMENTAL_CASE = "INSTRUMENTAL_CASE", // Творительный Горжусь Кем? Чем? Котом, книгой
    PREPOSITIONAL_CASE = "PREPOSITIONAL_CASE" // Предложный Думаю О ком? О чём? О коте, о книге
}

export interface QuestionPlaceHolder {
    case: WordCase | undefined
}
