import { SoccerGameModel } from "@/models/soccer_games.model";
import { ResponseError } from "@/utils/errors.util";

import { CurvaEntity, SoccerGameStatus } from "@/contracts/types/soccer_games.type";
import { SoccerTeamsService } from "./soccer_teams.service";
import { randomUUID } from "crypto";
import { SoccerGame } from "@/contracts/interfaces/soccer_games.interface";
import { TicketService } from "./ticket.service";
import { ITicket } from "@/contracts/interfaces/ticket.interface";
import { TournamentModel } from "@/models/tournament.model";
import { HouseWinsHistoryModel } from "@/models/house-wins-history.model";
import { ISoccerTeam } from "@/contracts/interfaces/soccer_teams.interface";

export class SoccerGameService {
    // methods

    // GET GAMES    

    public async get_all_soccer_games() {
        try {
            const soccer_games = await SoccerGameModel.find().sort({created_date: -1}).lean();
            if(!soccer_games) throw new ResponseError(404, "No se encontraron partidos de futbol");

            const soccer_teams_service = new SoccerTeamsService();
            const soccer_teams = await soccer_teams_service.get_all_soccer_teams();

            for(const soccer_game of soccer_games) {;

                const soccer_team = soccer_teams.find((soccer_team: ISoccerTeam) => soccer_team.id === soccer_game.soccer_teams[0]);
                if(soccer_team) {
                    soccer_game.soccer_teams[0] = soccer_team.name;
                }
                const soccer_team_two = soccer_teams.find((soccer_team: ISoccerTeam) => soccer_team.id === soccer_game.soccer_teams[1]);
                if(soccer_team_two) {
                    soccer_game.soccer_teams[1] = soccer_team_two.name;
                }
                const find_tournament = await TournamentModel.findById(soccer_game.tournament).lean();
                if(!find_tournament) throw new ResponseError(404, "No se encontró el torneo");
                soccer_game.tournament = find_tournament.name;
            }
            return soccer_games;
        } catch (err) {
            console.log(err);
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al obtener los partidos de futbol");
        }
    }

    public async get_soccer_game_by_id({id, parse_ids = true}: {id: string, parse_ids?: boolean}) {
        try {
            const soccer_game = await SoccerGameModel.findById(id);
            if(!soccer_game) throw new ResponseError(404, "No se encontró el partido de futbol");

            const soccer_teams_service = new SoccerTeamsService();
            const soccer_teams = await soccer_teams_service.get_all_soccer_teams();

            const soccer_team = soccer_teams.find((soccer_team: ISoccerTeam) => soccer_team.id === soccer_game.soccer_teams[0]);
            
            if(soccer_team) {
                soccer_game.soccer_teams[0] = soccer_team.id;
                
                if(parse_ids) {
                    soccer_game.soccer_teams[0] = soccer_team.name;
                }
            }
            const soccer_team_two = soccer_teams.find((soccer_team: ISoccerTeam) => soccer_team.id === soccer_game.soccer_teams[1]);
            if(soccer_team_two) {
                soccer_game.soccer_teams[1] = soccer_team_two.id;
                
                if(parse_ids) {
                    soccer_game.soccer_teams[1] = soccer_team_two.name;
                }
            }

            const find_tournament = await TournamentModel.findById(soccer_game.tournament).lean();
            if(!find_tournament) throw new ResponseError(404, "No se encontró el torneo");
            
            if(parse_ids) {
                soccer_game.tournament = find_tournament.name;
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
            let soccer_game = await SoccerGameModel.findOne({tournament}).lean();
            if(!soccer_game) throw new ResponseError(404, "No se encontró el partido de futbol");

            const soccer_teams_service = new SoccerTeamsService();
            const soccer_teams = await soccer_teams_service.get_all_soccer_teams();

            const soccer_team = soccer_teams.find((soccer_team: ISoccerTeam) => soccer_team.id === soccer_game.soccer_teams[0]);
            if(soccer_team) {
                soccer_game.soccer_teams[0] = soccer_team.name;
            }
            const soccer_team_two = soccer_teams.find((soccer_team: ISoccerTeam) => soccer_team.id === soccer_game.soccer_teams[1]);
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

            const find_tournament = await TournamentModel.findById(soccer_game.tournament).lean();
            if(!find_tournament) throw new ResponseError(404, "No se encontró el torneo");
            soccer_game.tournament = find_tournament.name;
            return soccer_game;
        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al obtener el partido de futbol");
        }
    }

    // GET CURVAS

    public async get_curva_by_id({id, game_id, include_game = false}: {id: string, game_id: string, include_game?: boolean}) {
        try {
            let curva = await SoccerGameModel.findById(game_id).lean();
            if(!curva) throw new ResponseError(404, "No se encontró la curva");

            const curva_found = curva.curvas_open.find((curva: CurvaEntity) => curva.id === id);
            if(!curva_found) throw new ResponseError(404, "No se encontró la curva");

            const find_tournament = await TournamentModel.findById(curva.tournament).lean();
            if(!find_tournament) throw new ResponseError(404, "No se encontró el torneo");
            curva.tournament = find_tournament.name;
            

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
            tournament,
            soccer_price,
            soccer_reward
        }: 
        {
            soccer_teams: [string, string], 
            start_date: Date, 
            end_time: Date, 
            status: SoccerGameStatus,
            tournament: string,
            soccer_price: number,
            soccer_reward: number

        }) {
        try {

            const response_exist_soccer_game = await this.verify_exist_soccer_game({soccer_teams});

            if(!response_exist_soccer_game.status) throw new ResponseError(400, "Ya hay un partido registrado");

            const curva = await this.generate_curva()
            
            let find_tournament = await TournamentModel.findOne({name: tournament}).lean();
            if(!find_tournament) {
                const created_tournament = await TournamentModel.create({
                    name: tournament,
                    created_date: new Date()
                });

                find_tournament = created_tournament;
            }

            await SoccerGameModel.create({
                created_date: new Date(),
                soccer_teams,
                start_date,
                end_time,
                status,
                score: [0, 0],
                tournament: find_tournament._id.toString(),
                curvas_open: [curva],
                soccer_price,
                soccer_reward
            })


        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al crear el partido de futbol");
        }
    }

    public async open_new_curva({game_id}: {game_id: string}) {
        try {
            // Verificar que el juego existe sin modificar el documento
            const game = await SoccerGameModel.findById(game_id).lean();
            if(!game) throw new ResponseError(404, "No se encontró el partido de futbol");
            
            // Generar la nueva curva
            const curva = await this.generate_curva();
            
            // Agregar la nueva curva usando findByIdAndUpdate para evitar problemas de validación
            const update_result = await SoccerGameModel.findByIdAndUpdate(
                game_id,
                {
                    $push: {
                        curvas_open: curva
                    }
                },
                { 
                    new: true, 
                    runValidators: true 
                }
            );

            if(!update_result) {
                throw new ResponseError(404, "No se pudo agregar la nueva curva");
            }

            return {
                status: true,
                curva
            }
        } catch (err) {
            console.error('Error en open_new_curva:', err);
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al abrir la curva");
        }
    }

    // PUT

    public async close_curva({game_id, curva_id}: {game_id: string, curva_id: string}) {
        try {
            // Verificar que el juego existe y encontrar la curva
            const game = await SoccerGameModel.findById(game_id).lean();
            if(!game) throw new ResponseError(404, "No se encontró el partido de futbol");
            
            const curvaIndex = game.curvas_open.findIndex((curva: CurvaEntity) => curva.id === curva_id);
            if(curvaIndex === -1) throw new ResponseError(404, "No se encontró la curva");
            
            // Actualizar solo el status de la curva usando findByIdAndUpdate
            const update_result = await SoccerGameModel.findByIdAndUpdate(
                game_id,
                {
                    $set: {
                        [`curvas_open.${curvaIndex}.status`]: "closed"
                    }
                },
                { 
                    new: true, 
                    runValidators: true 
                }
            );

            if(!update_result) {
                throw new ResponseError(404, "No se pudo cerrar la curva");
            }
            
        }   
        catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al cerrar la curva");
        }
    }

    public async update_curva_results({game_id, curva_id, curva_updated}: {game_id: string, curva_id: string, curva_updated: CurvaEntity}) {
        try {
            // Obtener el juego solo para verificar que existe y encontrar el índice de la curva
            const game = await SoccerGameModel.findById(game_id).lean();
            if(!game) throw new ResponseError(404, "No se encontró el partido de futbol");

            // Buscar la curva en el juego
            const curvaIndex = game.curvas_open.findIndex((curva: CurvaEntity) => curva.id === curva_id);
            if(curvaIndex === -1) throw new ResponseError(404, "No se encontró la curva");

            // Actualizar solo la curva específica usando findByIdAndUpdate para evitar problemas de validación
            // Esto actualiza solo el array de curvas sin tocar otros campos
            const update_result = await SoccerGameModel.findByIdAndUpdate(
                game_id,
                {
                    $set: {
                        [`curvas_open.${curvaIndex}.avaliable_results`]: curva_updated.avaliable_results,
                        [`curvas_open.${curvaIndex}.sold_results`]: curva_updated.sold_results,
                        [`curvas_open.${curvaIndex}.status`]: curva_updated.status,
                    }
                },
                { 
                    new: true, 
                    runValidators: true 
                }
            );

            if(!update_result) {
                throw new ResponseError(404, "No se pudo actualizar la curva");
            }

        }
        catch (err) {
            console.log(err);
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al actualizar los resultados de la curva");
        }
    }

    public async update_game_status({game_id, status}: {game_id: string, status: SoccerGameStatus}) {
        try {
            // Verificar que el juego existe sin modificar el documento
            const game = await SoccerGameModel.findById(game_id).lean();
            if(!game) throw new ResponseError(404, "No se encontró el partido de futbol");
            
            // Actualizar solo el status usando findByIdAndUpdate para evitar problemas de validación
            const update_result = await SoccerGameModel.findByIdAndUpdate(
                game_id,
                {
                    $set: {
                        status: status
                    }
                },
                { 
                    new: true, 
                    runValidators: true 
                }
            );

            if(!update_result) {
                throw new ResponseError(404, "No se pudo actualizar el estado del partido");
            }
        }
        catch (err) {
            console.log(err);   
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al actualizar el estado del partido de futbol");
        }
    }   

    public async end_soccer_game({game_id}: {game_id: string}) {
        try {

            const soccer_game = await this.get_soccer_game_by_id({id: game_id, parse_ids: false});
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
            // Verificar que el juego existe sin modificar el documento
            const game = await SoccerGameModel.findById(game_id).lean();
            if(!game) throw new ResponseError(404, "No se encontró el partido de futbol");
            
            // Actualizar solo el score usando findByIdAndUpdate para evitar problemas de validación
            const update_result = await SoccerGameModel.findByIdAndUpdate(
                game_id,
                {
                    $set: {
                        score: score
                    }
                },
                { 
                    new: true, 
                    runValidators: true 
                }
            );

            if(!update_result) {
                throw new ResponseError(404, "No se pudo actualizar el marcador del partido");
            }
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

            const find_exist_soccer_game = find_soccer_games.find((soccer_game: SoccerGame) => (soccer_game.status === "pending" || soccer_game.status === "in_progress"));

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
            const game_id = (game as any)?._id.toString()

            const tickets_service = new TicketService();
            const all_tickets = await tickets_service.get_tickets_by_game_id({game_id, no_error: true});
            
            // Filtrar solo tickets que no están cerrados aún
            const tickets = all_tickets.filter((ticket: ITicket) => !ticket.close);

            // Caso 1: Score > 7 (GANA LA CASA)
            if(score[0] > 7 || score[1] > 7) {
                await this.saveHouseWinHistory({
                    game_id,
                    reason: 'high_score',
                    score: score,
                    tickets: all_tickets, // Usar todos los tickets para el histórico
                    game: game,
                });
            }

            let winners: ITicket[] = [];
            let losers: ITicket[] = [];
            
            for (const ticket of tickets) {
                const results_purchased = ticket.results_purchased
                const result = results_purchased.find((result: string) => result == parsed_score)
                if(result) {
                    ticket.status = "won";
                    ticket.reward_amount = game.soccer_reward;
                    winners.push(ticket);
                    await tickets_service.change_ticket_status({ticket_id: ticket._id.toString(), status: "won"});
                } else {
                    ticket.status = "lost";
                    losers.push(ticket);
                    await tickets_service.change_ticket_status({ticket_id: ticket._id.toString(), status: "lost"});
                }
            }

            // Caso 2: No hay ganadores ni perdedores (GANA LA CASA)
            if(winners.length === 0 && losers.length === 0) {
                await this.saveHouseWinHistory({
                    game_id,
                    reason: 'no_winners',
                    tickets: tickets,
                    game: game,
                });
            }


        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al marcar los perdedores y ganadores de los usuarios");
        }
    }

    /**
     * Guardar histórico cuando gana la casa
     */
    private async saveHouseWinHistory({
        game_id,
        reason,
        score,
        tickets,
        game,
    }: {
        game_id: string
        reason: 'high_score' | 'no_winners'
        score?: [number, number]
        tickets: ITicket[]
        game: SoccerGame
    }) {
        try {
            // Calcular totales
            const total_tickets = tickets.length
            // Calcular cuánto ganó la casa: suma de todos los tickets vendidos en ese partido
            const house_winnings = tickets.reduce((sum, t) => sum + (t.payed_amount || 0), 0)

            // Obtener información del torneo
            const tournament = await TournamentModel.findById(game.tournament).lean()
            const tournament_name = tournament?.name || ''

            // Obtener nombres de los equipos
            const teams_service = new SoccerTeamsService()
            const all_teams = await teams_service.get_all_soccer_teams()
            
            const team1_id = game.soccer_teams[0]
            const team2_id = game.soccer_teams[1]
            
            const team1 = all_teams.find((t: any) => (t._id?.toString() || t.id) === team1_id)
            const team2 = all_teams.find((t: any) => (t._id?.toString() || t.id) === team2_id)

            const team1_name = team1?.name || team1_id
            const team2_name = team2?.name || team2_id

            // Guardar en el histórico
            await HouseWinsHistoryModel.create({
                soccer_game_id: game_id,
                reason: reason,
                score: score,
                total_tickets: total_tickets,
                house_winnings: house_winnings,
                created_at: new Date(),
                tournament: tournament_name,
                teams: [team1_name, team2_name],
            })
        } catch (error) {
            console.error('Error guardando histórico de ganancia de la casa:', error)
            // No lanzamos error para no interrumpir el flujo principal
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
            // Genera un número donde ambos lados del punto decimal estén entre 0-7
            const parteEntera = Math.floor(Math.random() * 8) // 0-7
            const parteDecimal = Math.floor(Math.random() * 8) // 0-7
            const user_number_result = `${parteEntera}.${parteDecimal}` // Formato: X.Y donde X y Y están entre 0-7
            if(avaliable_results.includes(user_number_result)) { // Si el número ya existe, intenta nuevamente
                i--
            } else {
                avaliable_results.push(user_number_result)
            }
        }
        
        curva.avaliable_results = avaliable_results
        return curva
    }
    
    
}