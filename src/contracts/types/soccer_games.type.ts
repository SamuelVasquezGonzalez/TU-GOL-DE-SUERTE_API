import { UUID } from "crypto"

export type SoccerGameStatus = 'pending' | 'in_progress' | 'finished'
export type CurvaStatus = 'open' | 'closed' | 'sold_out'
export type CurvaEntity = {
    id: UUID,
    avaliable_results: string[],
    sold_results: string[],
    status: CurvaStatus,
}