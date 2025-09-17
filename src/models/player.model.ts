import { IPlayer } from "@/contracts/interfaces/player.interface"
import { model, Schema } from "mongoose"

const PlayerSchema = new Schema<IPlayer>({
    name: { type: String, required: true },
    team_id: { type: String, required: true, default: null },
    created_at: { type: Date, required: true },
})

export const PlayerModel = model<IPlayer>("Player", PlayerSchema)