import type { GameFrontService } from "boardgame-web-common/front";
import type { Component } from "vue";

import SettingsComponent from "./components/Settings.vue";
import CahGameView from "./components/GameView.vue";
import PlayerComponent from "./components/PlayerComponent.vue";

export const cahGameType = "CARDS_AGAINST_HUMANITY"

export class CatanFrontService implements GameFrontService {
    type: string = cahGameType
    settingsComponent: Component = SettingsComponent
    gameViewComponent: Component = CahGameView
    playerComponent: Component | undefined = PlayerComponent
    statisticsComponent: Component | undefined = undefined
    canAddBot: boolean = true
    localization: any = {
        en: {
            CARDS_AGAINST_HUMANITY: 'Cards Against Humanity',
            selectCard: 'Select Red Card',
            playersGotPoints: 'Players got points: {players}'
        },
        ru: {
            CARDS_AGAINST_HUMANITY: 'Карты против всех',
            selectCard: 'Выберите красную карту',
            playersGotPoints: 'Игроки получили очки: {players}'
        }
    }
    gameStaticSettings = {
        minPlayers: 3,
        maxPlayers: 10
    }

}