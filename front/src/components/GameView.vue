<template>
    <div style="width: 100%;">
        <div class="flex items-center" style="flex-direction: column">
            <div style="margin-bottom: 1rem;">{{ t('status.' + status) }}</div>
            <div v-if="gameState.phase == CahGamePhase.PLAYERS_CHOOSE_ANSWERS" class="red-card"
                v-html="modifiedQuestionText">
            </div>

            <div class="white-card-container" v-if="gameState.phase == CahGamePhase.VOTING_FOR_ANSWERS">
                <div v-for="qaCard in questionAnswersCards" :class="qaCardClassStyle(qaCard)"
                    v-on:click="selectQACard(qaCard)" v-html="qaCard.text">
                </div>
            </div>

            <div style="width: 100%;">
                <div class="white-card-container">
                    <div v-for="answerCard in playerAnswersCards" :class="answerCardClassStyle(answerCard)"
                        v-on:click="selectAnswerCard(answerCard)">
                        {{ answerCard.text[WordCase.NOMINATIVE_CASE] }}
                    </div>
                </div>
            </div>
        </div>
        <div class="flex flex-col gap-2">
            <o-button v-on:click="submit" :disabled="!submitEnabled">{{ t('submit') }}</o-button>
            <o-button v-on:click="drawAllCards" :disabled="!drawAllCardsEnabled">{{ t('drawAllCards') }}</o-button>
        </div>
    </div>
</template>

<script setup lang="ts">

import { OButton, useOruga } from "@oruga-ui/oruga-next";

import { computed, ref, type PropType } from 'vue';
import { useI18n } from 'vue-i18n';

import { type Game } from 'boardgame-web-common';
import type { GameAction } from 'boardgame-web-common';

import { answers, type CahDrawCardsAction, CahGamePhase, cahPlayerCardsCount, questions, WordCase, type CahGamePublicState, type CahPrivatePlayerState, type CahSendAnswersAction, type PlayerAnswers, type QuestionPlaceHolder, type CahGameSettings, type CahVoteForAnswerAction } from "cah-back";

const oruga = useOruga();

enum Status {
    SELECT_WHITE_CARD = "SELECT_WHITE_CARD",
    SELECT_RED_CARD = "SELECT_RED_CARD",
    WAITING_FOR_OTHER_PLAYERS = "WAITING_FOR_OTHER_PLAYERS"
}

const { t } = useI18n({
    locale: 'en',
    messages: {
        en: {
            drawAllCards: 'Draw all cards for one point',
            status: {
                [Status.SELECT_WHITE_CARD]: "Select white card",
                [Status.SELECT_RED_CARD]: "Select red card",
                [Status.WAITING_FOR_OTHER_PLAYERS]: "Waiting for other players"
            }
        },
        ru: {
            drawAllCards: 'Сбросить все карыт за одно очко',
            status: {
                [Status.SELECT_WHITE_CARD]: "Выберите белую карту",
                [Status.SELECT_RED_CARD]: "Выберите красную карту",
                [Status.WAITING_FOR_OTHER_PLAYERS]: "Ожидание других игроков"
            }
        }
    }
})



interface AnswerCard {
    id: number
    text: Record<WordCase, string>
}

interface QuestionAnswerCard {
    playerId: string,
    text: string
}

const selectedQaCard = ref<QuestionAnswerCard | null>(null)

const drawAllCardsEnabled = computed(() => {
    return localPlayerPublicState.value.points && localPlayerPublicState.value.points > 0
})

const status = computed(() => {
    switch (props.gameState.phase) {
        case CahGamePhase.PLAYERS_CHOOSE_ANSWERS:
            if ((isLocalPlayerTurn.value && !props.gameSettings.voteMode) || submittedLocalPlayerAnswer.value) {
                return Status.WAITING_FOR_OTHER_PLAYERS
            }
            return Status.SELECT_WHITE_CARD
        case CahGamePhase.VOTING_FOR_ANSWERS:
            if ((isLocalPlayerTurn.value || props.gameSettings.voteMode) && !alreadyVoted.value) {
                return Status.SELECT_RED_CARD
            }
            return Status.WAITING_FOR_OTHER_PLAYERS
    }
})

const alreadyVoted = computed(() => {
    return props.gameState.playersSlectedAswers.flatMap(ans => ans.playerVotes).includes(localPlayer.value.userId)
})

async function drawAllCards() {
    if (!drawAllCardsEnabled) {
        return
    }
    const result = await oruga.dialog.open({
        title: t('drawAllCards'),
        content: t('drawAllCards') + '?',
        confirmButton: t('ok'),
        confirmVariant: "success",
        cancelButton: t('cancel'),
        buttonPosition: "right",
        closeOnConfirm: true
    }).promise
    if (result[1] == 'confirm') {
        performAction<CahDrawCardsAction>({
            type: 'CahDrawCardsAction'
        })
    }
}

const submitEnabled = computed(() => {
    switch (props.gameState.phase) {
        case CahGamePhase.VOTING_FOR_ANSWERS:
            return (isLocalPlayerTurn.value || props.gameSettings.voteMode) && selectedQaCard.value
        case CahGamePhase.PLAYERS_CHOOSE_ANSWERS:
            return (!isLocalPlayerTurn.value || props.gameSettings.voteMode) && selectedAnswers.value.length == requiredAnswersCount.value &&
                props.playerPrivateState.onHandAswersIds.length == cahPlayerCardsCount
        default:
            return false
    }
})

function submit() {
    switch (props.gameState.phase) {
        case CahGamePhase.VOTING_FOR_ANSWERS:
            submitQA()
            break
        case CahGamePhase.PLAYERS_CHOOSE_ANSWERS:
            if (isLocalPlayerTurn.value && !props.gameSettings.voteMode) {
                return
            }
            submitAnswers()
            break
    }
}

function submitQA() {
    performAction<CahVoteForAnswerAction>({
        type: 'CahVoteForAnswerAction',
        playerId: selectedQaCard.value?.playerId!
    })
    selectedQaCard.value = null
}

function qaCardClassStyle(qaCard: QuestionAnswerCard) {
    return {
        "hand-pointer": true,
        "red-card": true,
        "selected-qa-card": selectedQaCard.value?.playerId == qaCard.playerId && isLocalPlayerTurn
    }
}

function selectQACard(card: QuestionAnswerCard) {
    if (props.gameSettings.voteMode) {
        if (card.playerId == localPlayer.value.userId) {
            return
        }
    } else if (!isLocalPlayerTurn.value) {
        return
    }
    selectedQaCard.value = card
}

const questionAnswersCards = computed(() => {
    if (props.gameState.phase != CahGamePhase.VOTING_FOR_ANSWERS) {
        return []
    }
    const playersAnswers = props.gameState.playersSlectedAswers

    return playersAnswers.map((playerAnswer: PlayerAnswers) => {
        return {
            playerId: playerAnswer.playerId,
            text: replacePlaceholders(questionText.value!, playerAnswer.answersIds.map(id => answers[id]!))
        } as QuestionAnswerCard
    })
})

function submitAnswers() {
    performAction<CahSendAnswersAction>({
        type: 'CahSendAnswersAction',
        answersIds: selectedAnswers.value.map(answer => answer.id)
    })
    selectedAnswers.value = []
}



function countOccurrences(mainString: string, subString: string): number {
    const regex = new RegExp(subString, 'gi');
    const matches = mainString.match(regex);
    return matches ? matches.length : 0;
}

const questionText = computed(() => {
    return questions[props.gameState.questionCardId]
})

function replacePlaceholders(text: string, toReplaceList: Record<WordCase, string>[]) {
    const regex = new RegExp('{(.*?)}', 'ig');

    const regexResult = [...text.matchAll(regex)]

    let replaceIndex = 0

    let result = text

    regexResult.forEach(regexMatch => {
        const questionPlaceHolder = JSON.parse(regexMatch[0]) as QuestionPlaceHolder
        const replace = toReplaceList[replaceIndex]
        if (replace) {
            const wordCase = questionPlaceHolder.case ? questionPlaceHolder.case : WordCase.NOMINATIVE_CASE
            result = result.replace(regexMatch[0], '<span class="underline">' + replace[wordCase] + '</span>');
        } else {
            result = result.replace(regexMatch[0], '_______')
        }
        replaceIndex++
    })

    return result
}

const modifiedQuestionText = computed(() => {
    if (!questionText.value) {
        return null
    }
    const answersToReplace = submittedLocalPlayerAnswer.value ? submittedLocalPlayerAnswer.value.answersIds.map(answerId => {
        const answerCard: AnswerCard = {
            id: answerId,
            text: answers[answerId]
        }
        return answerCard
    }) : selectedAnswers.value
    const toReplaceList = answersToReplace.map(ans => ans.text)
    return replacePlaceholders(questionText.value, toReplaceList)
})

const requiredAnswersCount = computed(() => {
    if (!questionText.value) {
        return 0
    }
    return countOccurrences(questionText.value, '{(.*?)}')
})

const selectedAnswers = ref<AnswerCard[]>([])

function answerCardClassStyle(answerCard: AnswerCard) {
    return {
        "hand-pointer": true,
        "white-card": true,
        "selected-card": selectedAnswers.value.map(a => a.id).includes(answerCard.id)
    }
}

const playerAnswersCards = computed(() => {
    const answerIds = props.playerPrivateState.onHandAswersIds ?
        props.playerPrivateState.onHandAswersIds : []

    return answerIds.map(id => {
        return {
            id: id,
            text: answers[id]!
        } as AnswerCard
    })
})

function selectAnswerCard(answerCard: AnswerCard) {
    if (isLocalPlayerTurn.value && !props.gameSettings.voteMode) {
        return
    }
    if (submittedLocalPlayerAnswer.value) {
        return
    }
    const alreadeSelectedIndex = selectedAnswers.value.findIndex(answer => answer.id == answerCard.id)
    if (alreadeSelectedIndex >= 0) {
        selectedAnswers.value.splice(alreadeSelectedIndex, 1)
        return
    }

    if (selectedAnswers.value.length >= requiredAnswersCount.value) {
        selectedAnswers.value.pop()
    }
    selectedAnswers.value.push(answerCard)
}

const localPlayerPublicState = computed(() => {
    return props.gameState.playersStates[props.localPlayerIndex]!
})

const localPlayer = computed(() => {
    return props.game.players[props.localPlayerIndex]
})

const submittedLocalPlayerAnswer = computed(() => {
    return props.gameState.playersSlectedAswers.find(answer => answer.playerId == localPlayer.value.userId)
})

function performAction<T extends GameAction>(action: T) {
    emit('performAction', action)
}

const emit = defineEmits<{
    (e: 'performAction', action: GameAction): void
}>()

const isLocalPlayerTurn = computed(() => {
    return props.localPlayerIndex == props.gameState.activePlayerIndex
})

const props = defineProps({
    game: {
        type: Object as PropType<Game>,
        required: true
    },
    gameState: {
        type: Object as PropType<CahGamePublicState>,
        required: true
    },
    playerPrivateState: {
        type: Object as PropType<CahPrivatePlayerState>,
        required: true
    },
    localPlayerIndex: {
        type: Number,
        required: true
    },
    gameSettings: {
        type: Object as PropType<CahGameSettings>,
        required: true
    }
})

</script>

<style>
.red-card {
    background: rgb(255, 97, 97);
    border: var(--card-border);
    padding: 2rem;
    border-radius: 10px;
    margin-bottom: 1rem;
    box-shadow: var(--p-card-shadow);
    height: 10rem;
    min-width: 20rem;
}

.white-card-container {
    display: flex;
    overflow: auto;
    width: 100%;
    gap: 1rem;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
}

.white-card {
    background: rgb(255, 255, 255);
    border: 1px solid #dedede;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: var(--p-card-shadow);
    height: 10rem;
    flex: 0 0 25%;
}

.hand-pointer {
    cursor: pointer;
}

.selected-card {
    border: 3px solid #28ee00;
}

.selected-qa-card {
    border: 3px solid #5d00ff;
}

.underline {
    text-decoration: underline;
}
</style>