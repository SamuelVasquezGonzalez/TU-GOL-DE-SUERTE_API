import { GLOBAL_ENV } from "@/shared/contants";
import { Resend } from "resend";
import fs from "fs";
import path from "path";
import { ResponseError } from "@/utils/errors.util";

const resend = new Resend(GLOBAL_ENV.RESEND_API_KEY)

export interface SendEmailProps {
    name: string;
    email: string;
    temp_pssw?: string;
}

export interface SendAdminEmailProps {
    admin_name: string;
    admin_email: string;
    temp_admin_pssw: string;
}

export interface SendStaffEmailProps {
    staff_name: string;
    staff_email: string;
    temp_staff_pssw: string;
}

export interface SendRecoveryEmailProps {
    user_name: string;
    user_email: string;
    recover_code: number;
}

export interface SendTicketPurchaseEmailProps {
    user_name: string;
    user_email: string;
    ticket_number: number;
    game_info: {
        team1: string;
        team2: string;
        date: string;
        tournament: string;
    };
    results_purchased: string[];
    total_amount: number;
}

export interface SendEventConfirmationEmailProps {
    admin_name: string;
    admin_email: string;
    event_info: {
        id: string;
        team1: string;
        team2: string;
        date: string;
        tournament: string;
    };
}

export interface SendResultNotificationEmailProps {
    user_name: string;
    user_email: string;
    ticket_number: number;
    game_info: {
        team1: string;
        team2: string;
        final_score: string;
    };
    results_purchased: string[];
    is_winner: boolean;
    prize_amount?: number;
}

export interface SendTicketStatusUpdateEmailProps {
    user_name: string;
    user_email: string;
    ticket_number: number;
    old_status: string;
    new_status: string;
    game_info: {
        team1: string;
        team2: string;
        date: string;
    };
}

const send_welcome_email = async ({ name, email, temp_pssw }: SendEmailProps) => {
    try {
        const html = path.join(__dirname, "html", "WelcomeUserEmail.html");
        const loaded_html = fs.readFileSync(html, "utf8");

        const replaced_content = loaded_html
            .replace(/{{user_name}}/g, name)
            .replace(/{{user_email}}/g, email)
            .replace(/{{temp_user_pssw}}/g, temp_pssw || "")

            const response = await resend.emails.send({
                from: "Bienvenido <partidos@tugoldesuerte.com>",
                to: email,
                subject: "Bienvenido a TU-GOL-DE-SUERTE",
                html: replaced_content,
            })
    
            if(!response) throw new ResponseError(400, "Error al enviar el correo de bienvenida")

            return response
    } catch (error) {
        throw new ResponseError(500, "Error al enviar el correo de bienvenida")
    }
}

const send_welcome_admin_email = async ({ admin_name, admin_email, temp_admin_pssw }: SendAdminEmailProps) => {
    try {
        const html = path.join(__dirname, "html", "WelcomeAdminEmail.html");
        const loaded_html = fs.readFileSync(html, "utf8");

        const replaced_content = loaded_html
            .replace(/{{admin_name}}/g, admin_name)
            .replace(/{{admin_email}}/g, admin_email)
            .replace(/{{temp_admin_pssw}}/g, temp_admin_pssw)

            const response = await resend.emails.send({
                from: "Administración <partidos@tugoldesuerte.com>",
                to: admin_email,
                subject: "Bienvenido Administrador - TU-GOL-DE-SUERTE",
                html: replaced_content,
            })
    
            if(!response) throw new ResponseError(400, "Error al enviar el correo de bienvenida de administrador")

            return response
    } catch (error) {
        throw new ResponseError(500, "Error al enviar el correo de bienvenida de administrador")
    }
}

const send_welcome_staff_email = async ({ staff_name, staff_email, temp_staff_pssw }: SendStaffEmailProps) => {
    try {
        const html = path.join(__dirname, "html", "WelcomeStaffEmail.html");
        const loaded_html = fs.readFileSync(html, "utf8");

        const replaced_content = loaded_html
            .replace(/{{staff_name}}/g, staff_name)
            .replace(/{{staff_email}}/g, staff_email)
            .replace(/{{temp_staff_pssw}}/g, temp_staff_pssw)

            const response = await resend.emails.send({
                from: "Staff <partidos@tugoldesuerte.com>",
                to: staff_email,
                subject: "Bienvenido al Staff - TU-GOL-DE-SUERTE",
                html: replaced_content,
            })
    
            if(!response) throw new ResponseError(400, "Error al enviar el correo de bienvenida de staff")

            return response
    } catch (error) {
        throw new ResponseError(500, "Error al enviar el correo de bienvenida de staff")
    }
}

const send_recovery_email = async ({ user_name, user_email, recover_code }: SendRecoveryEmailProps) => {
    try {
        const html = path.join(__dirname, "html", "RecoveryEmail.html");
        const loaded_html = fs.readFileSync(html, "utf8");

        const replaced_content = loaded_html
            .replace(/{{user_name}}/g, user_name)
            .replace(/{{user_email}}/g, user_email)
            .replace(/{{recover_code}}/g, recover_code.toString())

            const response = await resend.emails.send({
                from: "Soporte <partidos@tugoldesuerte.com>",
                to: user_email,
                subject: "Recuperación de Contraseña - TU-GOL-DE-SUERTE",
                html: replaced_content,
            })
    
            if(!response) throw new ResponseError(400, "Error al enviar el correo de recuperación")

            return response
    } catch (error) {
        throw new ResponseError(500, "Error al enviar el correo de recuperación")
    }
}

const send_ticket_purchase_email = async ({ 
    user_name, 
    user_email, 
    ticket_number, 
    game_info, 
    results_purchased, 
    total_amount 
}: SendTicketPurchaseEmailProps) => {
    try {
        const html = path.join(__dirname, "html", "TicketPurchaseEmail.html");
        const loaded_html = fs.readFileSync(html, "utf8");

        const replaced_content = loaded_html
            .replace(/{{user_name}}/g, user_name)
            .replace(/{{user_email}}/g, user_email)
            .replace(/{{ticket_number}}/g, ticket_number.toString())
            .replace(/{{team1}}/g, game_info.team1)
            .replace(/{{team2}}/g, game_info.team2)
            .replace(/{{game_date}}/g, game_info.date)
            .replace(/{{tournament}}/g, game_info.tournament)
            .replace(/{{results_purchased}}/g, results_purchased.join(", "))
            .replace(/{{total_amount}}/g, total_amount.toString())

            const response = await resend.emails.send({
                from: "Compras <partidos@tugoldesuerte.com>",
                to: user_email,
                subject: "Confirmación de Compra de Boleta - TU-GOL-DE-SUERTE",
                html: replaced_content,
            })

            console.log("envie el email")
    
            if(!response) throw new ResponseError(400, "Error al enviar el correo de compra de boleta")
                console.log(response)

            return response
    } catch (error) {
        console.log(error)
        throw new ResponseError(500, "Error al enviar el correo de compra de boleta")
    }
}

const send_event_confirmation_email = async ({ 
    admin_name, 
    admin_email, 
    event_info 
}: SendEventConfirmationEmailProps) => {
    try {
        const html = path.join(__dirname, "html", "EventConfirmationEmail.html");
        const loaded_html = fs.readFileSync(html, "utf8");

        const replaced_content = loaded_html
            .replace(/{{admin_name}}/g, admin_name)
            .replace(/{{admin_email}}/g, admin_email)
            .replace(/{{event_id}}/g, event_info.id)
            .replace(/{{team1}}/g, event_info.team1)
            .replace(/{{team2}}/g, event_info.team2)
            .replace(/{{event_date}}/g, event_info.date)
            .replace(/{{tournament}}/g, event_info.tournament)

            const response = await resend.emails.send({
                from: "Eventos <partidos@tugoldesuerte.com>",
                to: admin_email,
                subject: "Confirmación de Evento - TU-GOL-DE-SUERTE",
                html: replaced_content,
            })
    
            if(!response) throw new ResponseError(400, "Error al enviar el correo de confirmación de evento")

            return response
    } catch (error) {
        throw new ResponseError(500, "Error al enviar el correo de confirmación de evento")
    }
}

const send_result_notification_email = async ({ 
    user_name, 
    user_email, 
    ticket_number, 
    game_info, 
    results_purchased, 
    is_winner, 
    prize_amount 
}: SendResultNotificationEmailProps) => {
    try {
        const html = path.join(__dirname, "html", "ResultNotificationEmail.html");
        const loaded_html = fs.readFileSync(html, "utf8");

        const replaced_content = loaded_html
            .replace(/{{user_name}}/g, user_name)
            .replace(/{{user_email}}/g, user_email)
            .replace(/{{ticket_number}}/g, ticket_number.toString())
            .replace(/{{team1}}/g, game_info.team1)
            .replace(/{{team2}}/g, game_info.team2)
            .replace(/{{final_score}}/g, game_info.final_score)
            .replace(/{{results_purchased}}/g, results_purchased.join(", "))
            .replace(/{{is_winner}}/g, is_winner ? "¡GANADOR!" : "No ganador")
            .replace(/{{prize_amount}}/g, prize_amount ? prize_amount.toString() : "0")

            const response = await resend.emails.send({
                from: "Resultados <partidos@tugoldesuerte.com>",
                to: user_email,
                subject: is_winner ? "¡FELICIDADES! Has ganado - TU-GOL-DE-SUERTE" : "Resultado de tu Apuesta - TU-GOL-DE-SUERTE",
                html: replaced_content,
            })
    
            if(!response) throw new ResponseError(400, "Error al enviar el correo de notificación de resultado")

            return response
    } catch (error) {
        throw new ResponseError(500, "Error al enviar el correo de notificación de resultado")
    }
}

const send_ticket_status_update_email = async ({ 
    user_name, 
    user_email, 
    ticket_number, 
    old_status, 
    new_status, 
    game_info 
}: SendTicketStatusUpdateEmailProps) => {
    try {
        const html = path.join(__dirname, "html", "TicketStatusUpdateEmail.html");
        const loaded_html = fs.readFileSync(html, "utf8");

        const replaced_content = loaded_html
            .replace(/{{user_name}}/g, user_name)
            .replace(/{{user_email}}/g, user_email)
            .replace(/{{ticket_number}}/g, ticket_number.toString())
            .replace(/{{old_status}}/g, old_status)
            .replace(/{{new_status}}/g, new_status)
            .replace(/{{team1}}/g, game_info.team1)
            .replace(/{{team2}}/g, game_info.team2)
            .replace(/{{game_date}}/g, game_info.date)

            const response = await resend.emails.send({
                from: "Estado Boletas <partidos@tugoldesuerte.com>",
                to: user_email,
                subject: "Estado de Boleta Actualizado - TU-GOL-DE-SUERTE",
                html: replaced_content,
            })
    
            if(!response) throw new ResponseError(400, "Error al enviar el correo de actualización de estado")

            return response
    } catch (error) {
        throw new ResponseError(500, "Error al enviar el correo de actualización de estado")
    }
}

// Exportaciones
export {
    send_welcome_email,
    send_welcome_admin_email,
    send_welcome_staff_email,
    send_recovery_email,
    send_ticket_purchase_email,
    send_event_confirmation_email,
    send_result_notification_email,
    send_ticket_status_update_email
}