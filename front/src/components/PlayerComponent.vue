<template>
    <div class="flex justify-center">
        <o-icon v-if="status == 'active'" icon="account"></o-icon>
        <o-icon v-if="status == 'thinking'" spin icon="timer-sand-empty"></o-icon>
        <o-icon v-if="status == 'checked'" icon="check"></o-icon>
    </div>
</template>
<script setup lang="ts">
import { OIcon } from '@oruga-ui/oruga-next';

import type { Player } from 'boardgame-web-common';
import { CahGamePhase, type CahGamePublicState, type CahGameSettings } from 'cah-back';
import { computed, type PropType } from 'vue';

const status = computed(() => {
    switch (props.gameState.phase) {
        case CahGamePhase.PLAYERS_CHOOSE_ANSWERS:
            if (props.gameSettings.voteMode) {
                if (playerAnswer.value) {
                    return 'checked'
                }
                return 'thinking'
            } else {
                if (isActivePlayer.value) {
                    return 'active'
                } else {
                    if (playerAnswer.value) {
                        return 'checked'
                    }
                    return 'thinking'
                }
            }
        case CahGamePhase.VOTING_FOR_ANSWERS:
            if (props.gameSettings.voteMode) {
                if (isPlayerVoted.value) {
                    return 'checked'
                }
                return 'thinking'
            } else {
                if (isActivePlayer.value) {
                    if (isPlayerVoted.value) {
                        return 'checked'
                    }
                    return 'thinking'
                } else {
                    return 'checked'
                }
            }
    }
})

const playerAnswer = computed(() => {
    return props.gameState.playersSlectedAswers.find(answer => answer.playerId == props.player.userId)
})

const isActivePlayer = computed(() => {
    const activePlayer = props.gameState.playersStates[props.gameState.activePlayerIndex]
    return activePlayer.playerId == props.player.userId
})

const isPlayerVoted = computed(() => {
    return props.gameState.playersSlectedAswers.flatMap(ans => ans.playerVotes).includes(props.player.userId)
})

const props = defineProps({
    player: {
        type: Object as PropType<Player>,
        required: true
    },
    gameState: {
        type: Object as PropType<CahGamePublicState>,
        required: true
    },
    gameSettings: {
        type: Object as PropType<CahGameSettings>,
        required: true
    }
})
</script>