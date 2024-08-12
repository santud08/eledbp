import Handlebars from "handlebars";
import nodemailer from "nodemailer";
import smtpTransport from "nodemailer-smtp-transport";
import { emailTemplateService } from "../../services/index.js";
import { envs } from "../../config/index.js";
import path from "path";

export const sendEmail = async (email, type, subject, language, substitutions = {}) => {
  try {
    console.log(".....Email Service Called.....");
    language = language ? language : envs.DEFAULT_LANGUAGE;
    const emailTemplate = await emailTemplateService.getTemplate(type, language);
    if (emailTemplate) {
      const template = Handlebars.compile(emailTemplate.content);
      const content = template(substitutions, {
        data: {
          intl: {
            locales: "en-US",
          },
        },
      });

      const transport = nodemailer.createTransport(
        smtpTransport({
          host: envs.smtp.host,
          port: envs.smtp.port,
          secure: envs.smtp.secure,
          auth: {
            user: envs.smtp.email,
            pass: envs.smtp.password,
          },
        }),
      );

      const mailInfo = {
        //from: String(envs.smtp.fromEmail),
        from: {
          name: String(envs.PROJECT_NAME),
          address: String(envs.smtp.fromEmail),
        },
        to: email,
        subject: subject ? subject : emailTemplate.subject,
        html: content,
        attachments: [
          {
            filename: "logo.png",
            path: path.resolve("src/assets/images/logo", "logo.png"),
            cid: "logoImage",
          },
        ],
      };

      await transport.sendMail(mailInfo);
      console.log(".....MAIL SENT.....");
    }
  } catch (error) {
    console.log("mail service error", error);
  }
};
