import { Document } from "mongoose";
import type { CurvaEntity, SoccerGameStatus } from "../types/soccer_games.type";

export interface SoccerGame extends Document {
    created_date: Date // fecha y hora de creacion del partido
    soccer_price: number // precio del partido
    soccer_teams: [string, string] // tupla de equipos de futbol => team1 vs team2
    start_date: Date // fecha y hora de inicio del partido
    end_time: Date // hora de finalizacion del partido
    status: SoccerGameStatus
    score: [number, number] // [goles del equipo 1, goles del equipo 2]
    tournament: string // torneo
    curvas_open: CurvaEntity[]

}

// Una curva son 64 posibles resultados del partido => tambien se entiende que se pueden vender 64 apuestas
// Cuando se vende una curva completa (osea 64 boletas) => se debe poder abrir otra curva 
// cada boleta, tiene un numero aleatorio de posible resultado de partido

// ENTONCES: 
//      - se abre una curva (64 boletas)
//      - se venden boletas (cada boleta tiene un numero aleatorio de posible resultado de partido)
//      - cuando se vendan las 64 boletas, se cierra la curva

// FLUJO: 
//      - se crea un partido y se abre una curva (64 boletas)
//      - cada usario compra una boleta (GENERA UN NUMERO DE BOLETA y NUMERO ALEATORIO DE RESULTADO DE PARTIDO "0.0 > 7.7")
//      - en caso de haber vendido las 64 boletas, queda cerrada la curva, y el administrador, podria generar otra curva si asi lo desea
//      - esperar la finalizacion del partido
//      - registrar los resultados del partido
//      - registrar la ganancia del ususario ganador por curva
//      - transferir las ganancias a cada usuario
//      - cerrar el partido