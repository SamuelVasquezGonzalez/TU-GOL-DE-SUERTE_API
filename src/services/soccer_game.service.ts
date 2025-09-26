import { SoccerGameModel } from "@/models/soccer_games.model";
import { ResponseError } from "@/utils/errors.util";

import { CurvaEntity, SoccerGameStatus } from "@/contracts/types/soccer_games.type";
import { SoccerTeamsService } from "./soccer_teams.service";
import { randomUUID } from "crypto";
import { SoccerGame } from "@/contracts/interfaces/soccer_games.interface";
import { TicketService } from "./ticket.service";
import { ITicket } from "@/contracts/interfaces/ticket.interface";

export class SoccerGameService {
    // methods

    // GET GAMES    

    public async get_all_soccer_games() {
        try {
            const soccer_games = await SoccerGameModel.find().sort({created_date: -1}).lean();
            if(!soccer_games) throw new ResponseError(404, "No se encontraron partidos de futbol");

            const soccer_teams_service = new SoccerTeamsService();
            const soccer_teams = await soccer_teams_service.get_all_soccer_teams();

            for(const soccer_game of soccer_games) {
                const soccer_team = soccer_teams.find((soccer_team) => soccer_team.id === soccer_game.soccer_teams[0]);
                if(soccer_team) {
                    soccer_game.soccer_teams[0] = soccer_team.name;
                }
                const soccer_team_two = soccer_teams.find((soccer_team) => soccer_team.id === soccer_game.soccer_teams[1]);
                if(soccer_team_two) {
                    soccer_game.soccer_teams[1] = soccer_team_two.name;
                }
            }
            return soccer_games;
        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al obtener los partidos de futbol");
        }
    }

    public async get_soccer_game_by_id({id}: {id: string}) {
        try {
            const soccer_game = await SoccerGameModel.findById(id);
            if(!soccer_game) throw new ResponseError(404, "No se encontró el partido de futbol");

            const soccer_teams_service = new SoccerTeamsService();
            const soccer_teams = await soccer_teams_service.get_all_soccer_teams();

            const soccer_team = soccer_teams.find((soccer_team) => soccer_team.id === soccer_game.soccer_teams[0]);
            if(soccer_team) {
                soccer_game.soccer_teams[0] = soccer_team.name;
            }
            const soccer_team_two = soccer_teams.find((soccer_team) => soccer_team.id === soccer_game.soccer_teams[1]);
            if(soccer_team_two) {
                soccer_game.soccer_teams[1] = soccer_team_two.name;
            }
            return soccer_game;
        }
        catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al obtener los partidos de futbol");
        }
    }

    public async get_soccer_game_by_tournament({tournament}: {tournament: string}) {
        try {
            const soccer_game = await SoccerGameModel.findOne({tournament}).lean();
            if(!soccer_game) throw new ResponseError(404, "No se encontró el partido de futbol");

            const soccer_teams_service = new SoccerTeamsService();
            const soccer_teams = await soccer_teams_service.get_all_soccer_teams();

            const soccer_team = soccer_teams.find((soccer_team) => soccer_team.id === soccer_game.soccer_teams[0]);
            if(soccer_team) {
                soccer_game.soccer_teams[0] = soccer_team.name;
            }
            const soccer_team_two = soccer_teams.find((soccer_team) => soccer_team.id === soccer_game.soccer_teams[1]);
            if(soccer_team_two) {
                soccer_game.soccer_teams[1] = soccer_team_two.name;
            }
            return soccer_game;
        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al obtener el partido de futbol");
        }
    }
    
    public async get_soccer_game_by_date({date}: {date: Date}) {
        try {
            const soccer_game = await SoccerGameModel.findOne({date}).lean();
            if(!soccer_game) throw new ResponseError(404, "No se encontró el partido de futbol");
            return soccer_game;
        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al obtener el partido de futbol");
        }
    }

    // GET CURVAS

    public async get_curva_by_id({id, game_id, include_game = false}: {id: string, game_id: string, include_game?: boolean}) {
        try {
            const curva = await SoccerGameModel.findById(game_id).lean();
            if(!curva) throw new ResponseError(404, "No se encontró la curva");

            const curva_found = curva.curvas_open.find((curva) => curva.id === id);
            if(!curva_found) throw new ResponseError(404, "No se encontró la curva");

            return {
                game_id,
                curva: curva_found,
                game: include_game ? curva : null
            }
        }
        catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al obtener la curva");
        }
    }

    // POST

    public async create_new_soccer_game(
        {
            soccer_teams, 
            start_date, 
            end_time, 
            status, 
            tournament
        }: 
        {
            soccer_teams: [string, string], 
            start_date: Date, 
            end_time: Date, 
            status: SoccerGameStatus,
            tournament: string

        }) {
        try {

            const response_exist_soccer_game = await this.verify_exist_soccer_game({soccer_teams});

            if(!response_exist_soccer_game.status) throw new ResponseError(400, "Ya hay un partido registrado");

            const curva = await this.generate_curva()

            await SoccerGameModel.create({
                created_date: new Date(),
                soccer_teams,
                start_date,
                end_time,
                status,
                score: [0, 0],
                tournament,
                curvas_open: [curva]
            })


        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al crear el partido de futbol");
        }
    }

    public async open_new_curva({game_id}: {game_id: string}) {
        try {
            const soccer_game = await this.get_soccer_game_by_id({id: game_id});
            if(!soccer_game) throw new ResponseError(404, "No se encontró el partido de futbol");
            const curva = await this.generate_curva();
            soccer_game.curvas_open.push(curva);
            await soccer_game.save();
            return {
                status: true,
                curva
            }
        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al abrir la curva");
        }
    }

    // PUT

    public async close_curva({game_id, curva_id}: {game_id: string, curva_id: string}) {
        try {
            const soccer_game = await this.get_soccer_game_by_id({id: game_id});
            if(!soccer_game) throw new ResponseError(404, "No se encontró el partido de futbol");
            const curva = soccer_game.curvas_open.find((curva) => curva.id === curva_id);
            if(!curva) throw new ResponseError(404, "No se encontró la curva");
            curva.status = "closed";
            await soccer_game.save();
            
        }   
        catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al cerrar la curva");
        }
    }

    public async update_curva_results({game_id, curva_id, curva_updated}: {game_id: string, curva_id: string, curva_updated: CurvaEntity}) {
        try {
            // Obtener el documento del juego sin .lean() para poder guardarlo
            const game = await this.get_soccer_game_by_id({id: game_id});
            if(!game) throw new ResponseError(404, "No se encontró el partido de futbol");

            // Buscar la curva en el juego
            const curvaIndex = game.curvas_open.findIndex((curva) => curva.id === curva_id);
            if(curvaIndex === -1) throw new ResponseError(404, "No se encontró la curva");

            // Actualizar la curva directamente en el arreglo
            game.curvas_open[curvaIndex].avaliable_results = curva_updated.avaliable_results;
            game.curvas_open[curvaIndex].sold_results = curva_updated.sold_results;
            game.curvas_open[curvaIndex].status = curva_updated.status;

            // Guardar el documento
            await game.save();

        }
        catch (err) {
            console.log(err);
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al actualizar los resultados de la curva");
        }
    }

    public async end_soccer_game({game_id}: {game_id: string}) {
        try {

            const soccer_game = await this.get_soccer_game_by_id({id: game_id});
            if(!soccer_game) throw new ResponseError(404, "No se encontró el partido de futbol");

            const closed_curvas = this.close_all_curvas({curvas_open: soccer_game.curvas_open});
            soccer_game.curvas_open = closed_curvas;

            await this.mark_losers_winners_users({game: soccer_game});
            
            soccer_game.status = "finished";
            await soccer_game.save();
        }
        catch (err) {
            console.log(err);
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al finalizar el partido de futbol");
        }
    }

    public async update_soccer_game_score({game_id, score}: {game_id: string, score: [number, number]}) {
        try {
            const soccer_game = await this.get_soccer_game_by_id({id: game_id});
            if(!soccer_game) throw new ResponseError(404, "No se encontró el partido de futbol");
            soccer_game.score = score;
            await soccer_game.save();
        }
        catch (err) {
            console.log(err);
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al actualizar el partido de futbol");
        }
    }



    // private methods

    private async verify_exist_soccer_game(
        {
            soccer_teams,
        }: 
        {
            soccer_teams: [string, string],

        }
    ) {
        try {
            const team_one = soccer_teams[0];
            const team_two = soccer_teams[1];
            
            const soccer_team_service = new SoccerTeamsService();

            const [team_one_entity, team_two_entity] = await Promise.all([
                soccer_team_service.get_soccer_team_by_id({id: team_one}),
                soccer_team_service.get_soccer_team_by_id({id: team_two})
            ]);

            if(!team_one_entity || !team_two_entity) throw new ResponseError(404, "No se encontraron los equipos de futbol");

            const find_soccer_games = await SoccerGameModel.find({soccer_teams: [team_one, team_two]}).select("status").lean();

            const find_exist_soccer_game = find_soccer_games.find((soccer_game) => (soccer_game.status === "pending" || soccer_game.status === "in_progress"));

            const status = find_exist_soccer_game ? false : true

            return {
                team_one_entity,
                team_two_entity,
                status
            }
            
        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al verificar el partido de futbol");
        }
    }

    private close_all_curvas({curvas_open}: {curvas_open: CurvaEntity[]}): CurvaEntity[] {
        try {
            const closed_curvas: CurvaEntity[] = [];
            
            for(const curva of curvas_open) {
                closed_curvas.push({
                    ...curva,
                    status: "closed"
                });
            }

            return closed_curvas;
        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al cerrar todas las curvas");
        }
    }

    private async mark_losers_winners_users({game}: {game: SoccerGame}) {
        try {
            if(!game) throw new ResponseError(404, "No se proporcionó el partido de futbol");

            if(game.status === "finished") throw new ResponseError(404, "El partido ya ha finalizado");

            const score = game.score
            const parsed_score = `${score[0]}.${score[1]}`

            const tickets_service = new TicketService();
            const tickets = await tickets_service.get_tickets_by_game_id({game_id: (game as any)?._id.toString()});

            let winners: ITicket[] = [];
            let losers: ITicket[] = [];
            
            for (const ticket of tickets) {
                const results_purchased = ticket.results_purchased
                const result = results_purchased.find((result) => result == parsed_score)
                if(result) {
                    ticket.status = "won";
                    winners.push(ticket);
                    await tickets_service.change_ticket_status({ticket_id: ticket._id.toString(), status: "won"});
                } else {
                    ticket.status = "lost";
                    losers.push(ticket);
                    await tickets_service.change_ticket_status({ticket_id: ticket._id.toString(), status: "lost"});
                }
            }

            if(winners.length === 0 && losers.length === 0) {
                console.log("GANA LA CASA")
            }


        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al marcar los perdedores y ganadores de los usuarios");
        }
    }


    private async generate_curva() {
        const curva_tope = 64;
        let avaliable_results: string[] = []

        let curva: CurvaEntity = {
            id: randomUUID(),
            avaliable_results: [],
            sold_results: [],
            status: "open"
        }
        
        for (let i = 0; i < curva_tope; i++) {
            // Genera un número aleatorio entre 0.0 y 7.7 con formato decimal de un dígito
            const randomDecimal = Math.floor(Math.random() * 78) / 10 // Genera 0.0 a 7.7
            const user_number_result = randomDecimal.toFixed(1) // Mantener como string para preservar formato
            if(avaliable_results.includes(user_number_result)) { // Si el número ya existe, intenta nuevamente
                console.log(user_number_result, "ya existe")
                i--
            } else {
                avaliable_results.push(user_number_result)
            }
        }
        
        curva.avaliable_results = avaliable_results
        return curva
    }
    
    
}