import { SoccerGame } from "@/contracts/interfaces/soccer_games.interface";
import { model, Schema } from "mongoose";

const CurvaSchema = new Schema({
    id: { type: String, required: true },
    avaliable_results: { type: [String], required: true },
    sold_results: { type: [String], required: true },
    status: { type: String, required: true }
}, { _id: false });

const SoccerGameSchema = new Schema<SoccerGame>({
    created_date: { type: Date, required: true },
    soccer_teams: { type: [String], required: true },
    start_date: { type: Date, required: true },
    end_time: { type: Date, required: true },
    soccer_price: { type: Number, required: true },
    status: { type: String, required: true },
    score: { type: [Number], required: true },
    tournament: { type: String, required: true },
    curvas_open: { type: [CurvaSchema], required: true },
    soccer_reward: { type: Number, required: true },
});

export const SoccerGameModel = model<SoccerGame>("SoccerGame", SoccerGameSchema);