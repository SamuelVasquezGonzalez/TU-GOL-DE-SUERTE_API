import mongoose, { model, Schema } from "mongoose";
import { ISoccerTeam } from "@/contracts/interfaces/soccer_teams.interface";

const SoccerTeamSchema = new Schema<ISoccerTeam>({
    name: { type: String, required: true },
    avatar: { type: mongoose.Schema.Types.Mixed, required: true },
    created: { type: Date, required: true },
    color: { type: String, required: true },
});

export const SoccerTeamModel = model<ISoccerTeam>("SoccerTeam", SoccerTeamSchema);