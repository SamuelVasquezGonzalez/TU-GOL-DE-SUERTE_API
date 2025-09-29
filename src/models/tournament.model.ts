import { ITournament } from "@/contracts/interfaces/tournament.interface";
import { model, Schema } from "mongoose";

const TournamentSchema = new Schema<ITournament>({
    name: { type: String, required: true },
    created_date: { type: Date, required: true },
});

export const TournamentModel = model<ITournament>("Tournament", TournamentSchema);