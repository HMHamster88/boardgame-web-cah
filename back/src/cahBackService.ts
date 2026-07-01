import { GameStatusEnum, getShuffledArray, handleMessage, type Game, type GameAction, type GameBackService, type GameContext, type GameSettings, type GameState, type MesasgeHandlers } from "boardgame-web-common"
import { CahGamePhase, cahPlayerCardsCount, type CahDrawCardsAction, type CahGamePrivateState, type CahGamePublicState, type CahGameSettings, type CahPrivatePlayerState, type CahPublicPlayerState, type CahVoteForAnswerAction, type CahSendAnswersAction } from "./types"
import answers from "./texts/answers"
import questions from "./texts/questions"
import _ from "lodash"

export const CahStaticSettings = {
    minPlayers: 2,
    maxPlayers: 6
}

export class CahGameBackService implements GameBackService {

    startGame(game: Game, gameSettings: GameSettings): GameState {
        game.status = GameStatusEnum.STARTED

        let answerDeck = getShuffledArray(Array.from({ length: answers.length }, (_, i) => i))

        const playersStates = game.players.map(player => {
            const playerCards = answerDeck.splice(0, cahPlayerCardsCount)
            const playerState: CahPrivatePlayerState = {
                playerId: player.userId,
                onHandAswersIds: playerCards
            }
            return playerState
        })

        const privateState: CahGamePrivateState = {
            questionDeck: getShuffledArray(Array.from({ length: questions.length }, (_, i) => i)),
            answerDeck: answerDeck,
            playersStates: playersStates,
            questionDiscardPile: [],
            answerDiscardPile: []
        }

        const publicState: CahGamePublicState = {
            phase: CahGamePhase.PLAYERS_CHOOSE_ANSWERS,
            questionCardId: privateState.questionDeck.shift()!,
            playersSlectedAswers: [],
            activePlayerIndex: _.random(0, game.players.length - 1),
            playersStates: game.players.map(player => {
                return {
                    playerId: player.userId,
                    points: 0
                } as CahPublicPlayerState
            }),
            winnersIds: [],
            statistics: {
                turnCount: 0
            }
        }

        const gameState: GameState = {
            id: game.id,
            publicState: publicState,
            privateState: privateState
        }

        return gameState
    }

    type = 'CARDS_AGAINST_HUMANITY'
    localizedName = {
        en: {
            CARDS_AGAINST_HUMANITY: 'Cards Against Humanity'
        },
        ru: {
            CARDS_AGAINST_HUMANITY: 'Карты против всех'
        }
    }

    gameStaticSettings = CahStaticSettings

    getDefaultSettings(): GameSettings {
        const settings: CahGameSettings = {
            id: '',
            pointsToWin: 10,
            voteMode: false
        }
        return settings
    }

    getAndRemoveFirstNotInArray<T>(source: T[], findArray: T[], comparator: ((a: T, b: T) => boolean)) {
        let index = source.findIndex(el => findArray.find((fel: T) => comparator(el, fel)) == undefined)
        if (index <= 0) {
            index = 0
        }
        const result = source[index]
        source.splice(index, 1)
        return result
    }


    async performAction(gameContext: GameContext, gameAction: GameAction, playerId: string): Promise<void> {
        const game = gameContext.game
        const gameState = gameContext.gameState
        const settings = gameContext.gameSettings as CahGameSettings

        if (!gameState) {
            return
        }
        const publicState = gameState.publicState as CahGamePublicState
        const privateState = gameState.privateState as CahGamePrivateState
        const activePlayer = game.players[publicState.activePlayerIndex]
        const activePlayerId = activePlayer?.userId
        const playerPublicState = publicState.playersStates.find(pl => pl.playerId == playerId)!
        const playerPrivateState = privateState.playersStates.find(pl => pl.playerId == playerId)!

        type catanActionTypes = CahSendAnswersAction |
            CahVoteForAnswerAction |
            CahDrawCardsAction

        const handlers: MesasgeHandlers<catanActionTypes> = {
            CahDrawCardsAction: () => {
                if (playerPublicState.points && playerPublicState.points > 0) {
                    privateState.answerDiscardPile.push(...playerPrivateState.onHandAswersIds)
                    playerPrivateState.onHandAswersIds = []
                    this.pushFromDeck(privateState.answerDeck, privateState.answerDiscardPile, playerPrivateState.onHandAswersIds, cahPlayerCardsCount)
                    playerPublicState.points--
                } else {
                    console.log('Player have no points')
                }
            },
            CahSendAnswersAction: (action) => {
                if (publicState.phase != CahGamePhase.PLAYERS_CHOOSE_ANSWERS) {
                    return
                }
                if (!privateState.playersStates) {
                    return
                }
                const playerState = privateState.playersStates.find(ps => ps.playerId == playerId)
                if (!playerState) {
                    console.log(`CahSendAnswersAction: Invalid player id "${playerId}"`)
                    return
                }

                // remove cards from hand
                _.pull(playerState.onHandAswersIds, ...action.answersIds)

                publicState.playersSlectedAswers.push({
                    playerId: playerId,
                    answersIds: action.answersIds,
                    playerVotes: []
                })

                const requiredAnswerCount = settings.voteMode ? game.players.length : game.players.length - 1

                if (publicState.playersSlectedAswers.length >= requiredAnswerCount) {
                    publicState.playersSlectedAswers = getShuffledArray(publicState.playersSlectedAswers)
                    publicState.phase = CahGamePhase.VOTING_FOR_ANSWERS
                    gameContext.sendNotify(activePlayerId, 'selectCard', undefined)
                }
            },
            CahVoteForAnswerAction: (action) => {
                if (publicState.phase != CahGamePhase.VOTING_FOR_ANSWERS) {
                    return
                }
                if (playerId != activePlayerId && !settings.voteMode) {
                    return
                }

                if (playerId == action.playerId) {
                    console.log('Cant vote for yourself')
                    return
                }

                const vote = publicState.playersSlectedAswers.find(answer => answer.playerVotes.includes(playerId))

                if (vote) {
                    console.log('Already voted')
                    return
                }

                const answerForVote = publicState.playersSlectedAswers.find(ans => ans.playerId == action.playerId)!
                answerForVote?.playerVotes.push(playerId)

                const allVoteCount = publicState.playersSlectedAswers.flatMap(ans => ans.playerVotes).length

                const requiredVoteCount = settings.voteMode ? game.players.length : 1

                if (allVoteCount >= requiredVoteCount) {

                    publicState.playersSlectedAswers.forEach(answer => {
                        const answerPlayerState = publicState.playersStates.find(pl => pl.playerId == answer.playerId)!
                        answerPlayerState.points! += answer.playerVotes.length

                    })

                    const notifyParam = publicState.playersSlectedAswers.filter(ans => ans.playerVotes.length > 0).map(ans => {
                        const player = game.players.find(pl => pl.userId == ans.playerId)
                        return `${player?.name}: ${ans.playerVotes.length}`
                    }).join(', ')

                    gameContext.sendNotify(undefined, 'playersGotPoints', {
                        players: notifyParam
                    })

                    const playerPoints = publicState.playersStates.map(pl => pl.points!)
                    const maxPlayerPoints = Math.max(...playerPoints)

                    if (maxPlayerPoints >= settings.pointsToWin) {
                        publicState.winnersIds = publicState.playersStates.filter(pl => pl.points! >= settings.pointsToWin).map(pl => pl.playerId)
                        game.status = GameStatusEnum.FINISHED
                    }

                    publicState.playersSlectedAswers.forEach(pa => {
                        privateState.answerDiscardPile.push(...pa.answersIds)

                    })

                    privateState.playersStates?.forEach(ps => {
                        this.pushFromDeck(privateState.answerDeck, privateState.answerDiscardPile, ps.onHandAswersIds, cahPlayerCardsCount - ps.onHandAswersIds.length)
                    })

                    privateState.questionDiscardPile.push(publicState.questionCardId)

                    if (privateState.questionDeck.length == 0) {
                        privateState.questionDeck = getShuffledArray(privateState.questionDiscardPile)
                    }

                    publicState.questionCardId = privateState.questionDeck.shift()!

                    publicState.playersSlectedAswers = []
                    publicState.phase = CahGamePhase.PLAYERS_CHOOSE_ANSWERS
                    publicState.activePlayerIndex = (publicState.activePlayerIndex + 1) % game.players.length
                }
            }
        }

        await handleMessage(handlers, gameAction)
    }

    pushFromDeck(deck: number[], discardPile: number[], pushTo: number[], count: number) {
        if (!count) {
            return
        }
        if (deck.length < count) {
            const addiitonal = count - deck.length
            pushTo.push(...deck)
            deck.push(...getShuffledArray(discardPile))
            pushTo.push(...deck.splice(0, addiitonal))
        } else {
            const slice = deck.splice(0, count)
            pushTo.push(...slice)
        }
    }

}