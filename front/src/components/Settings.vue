<template>
    <div>
        <div class="settings-header">
            <o-field :label="t('maxPoints')">
                <o-input v-model="settings.pointsToWin" number type="number" :min="4" placeholder="Number" />
            </o-field>
            <o-field>
                <o-switch :label="t('voteMode')" v-model="settings.voteMode" />
            </o-field>
        </div>
    </div>
</template>

<script setup lang="ts">

import { OField, OInput, OSwitch } from '@oruga-ui/oruga-next';

import { type PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import type { GameAction } from 'boardgame-web-common';
import type { CahGameSettings } from 'cah-back';

const { t } = useI18n({
    locale: 'en',
    messages: {
        en: {
            voteMode: 'Vote mode'
        },
        ru: {
            voteMode: 'Режим голосования'
        }
    }
})


const props = defineProps({
    settings: {
        type: Object as PropType<CahGameSettings>,
        required: true
    },
    canEdit: {
        type: Boolean,
        default: true
    }
})

const emit = defineEmits<{
    (e: 'performAction', action: GameAction): void
}>()

</script>

<style>
.settings-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}
</style>