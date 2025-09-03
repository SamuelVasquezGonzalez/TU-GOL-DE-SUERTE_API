import { Document } from "mongoose";
import { SoccerTeamAvatar } from "../types/soccer_teams.type";

export interface ISoccerTeam extends Document {
    name: string
    avatar: SoccerTeamAvatar
    created: Date
    color: string
}