import { CatanFrontService as CahFrontService } from './cahFrontService'

export function getGameFrontService() {
    return new CahFrontService()
}