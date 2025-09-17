import { Document } from "mongoose"

export interface IPlayer extends Document {
    name: string
    team_id: string
    created_at: Date
}