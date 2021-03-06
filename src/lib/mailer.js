/**
send emails
**/

import nodemailer from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
import request from 'request';

export default ( config, logger ) => ({

    sendContactUpdateEmail: (recipient, theGUID) => new Promise((resolve, reject) => {

        const smtpConfig = {
            host: 'email-smtp.us-west-2.amazonaws.com',
            port: 465,
            secure: true,
            requireTLS: true,
            auth: {
                user: config.SMTP_USER,
                pass: config.SMTP_PASS
            }
        };

        const transport = nodemailer.createTransport(smtpConfig);

        const options={
            viewEngine: {},
            viewPath: 'public/email-templates/',
            extName: '.hbs'
        };

        //attach the plugin to the nodemailer transporter
        transport.use('compile', hbs(options));

        let uLink=config.BASE_URL+'contact/?token='+theGUID+'&email='+recipient;

        let emContext={ updateLink: uLink ,expiresIn: config.PEER_GUID_TIMEOUT/3600 };

        const mailOptions = {
            from: 'MSF-REACH <admin@msf-reach.org>', // sender address
            to: recipient,
            subject: 'Update your MSF-REACH contact details',
            template: 'plain',
            context: emContext
        };

        // send mail with defined transport object
        logger.info('Sending email to ' + recipient);
        transport.sendMail(mailOptions, (error, info) => {
            if (error) {
                logger.error(error.message);
                reject(error);
            }
            else
            {
                logger.info('Email %s sent: %s', info.messageId, info.response);
                resolve(info); // fixme probably want to resolve something useful
            }
        });
    }),

    sendShareNotificationEmail: (access_token, sender_oid, recipient_oid, contact_data) => new Promise((resolve, reject) => {

        const smtpConfig = {
            host: 'email-smtp.us-west-2.amazonaws.com',
            port: 465,
            secure: true,
            requireTLS: true,
            auth: {
                user: config.SMTP_USER,
                pass: config.SMTP_PASS
            }
        };

        const transport = nodemailer.createTransport(smtpConfig);

        const options={
            viewEngine: {},
            viewPath: 'public/email-templates/',
            extName: '.hbs'
        };

        //attach the plugin to the nodemailer transporter
        transport.use('compile', hbs(options));

        request.get('https://graph.microsoft.com/v1.0/users/'+sender_oid, {
            'headers': {
                'Authorization': 'Bearer ' + access_token,
                'Content-Type': 'application/json'
            }
        }, function(err, res, body1) {
            if(err){
                logger.error(err.message);
                reject(err);
            }
            else{

                request.get('https://graph.microsoft.com/v1.0/users/'+recipient_oid, {
                    'headers': {
                        'Authorization': 'Bearer ' + access_token,
                        'Content-Type': 'application/json'
                    }
                }, function(err, res, body2) {
                    if(err){
                        logger.error(err.message);
                        reject(err);
                    }
                    else {
                        let sender = JSON.parse(body1);
                        let recipient = JSON.parse(body2);

                        let emContext={
                            sender_name: sender.displayName,
                            recipient_name: recipient.displayName,
                            contact_hyperlink: config.BASE_URL+'#contact'+contact_data.id,
                            contact_name: contact_data.properties.name
                        };

                        const mailOptions = {
                            from: 'MSF-REACH <admin@msf-reach.org>', // sender address -
                            to: recipient.userPrincipalName,
                            subject: 'Contact sharing notification',
                            template: 'share',
                            context: emContext
                        };

                        // send mail with defined transport object
                        logger.info('Sending sharing email notification');
                        transport.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                logger.error(error.message);
                                reject(error);
                            }
                            else
                            {
                                logger.info('Email %s sent: %s', info.messageId, info.response);
                                resolve(contact_data); // pass contact data back out for next promise
                            }
                        });
                    }
                });
            }
        });
    }),

    emailSubscribers: (data, id) => new Promise((resolve, reject) => {
        logger.debug(data);

        const smtpConfig = {
            host: 'email-smtp.us-west-2.amazonaws.com',
            port: 465,
            secure: true,
            requireTLS: true,
            auth: {
                user: config.SMTP_USER,
                pass: config.SMTP_PASS
            }
        };

        const transport = nodemailer.createTransport(smtpConfig);

        const options={
            viewEngine: {},
            viewPath: 'public/email-templates/',
            extName: '.hbs'
        };

        //attach the plugin to the nodemailer transporter
        transport.use('compile', hbs(options));

        console.log(data.subscribers); // eslint-disable-line no-console

        if (data.subscribers) {
            for (let i = 0; i < data.subscribers.length; i++) {

                if (data.subscribers[i] !== '') {
                    let emContext={
                        eventLink: config.BASE_URL+'events/?eventId='+id,
                        loginLink: config.BASE_URL+'login',
                        unsubscribeLink: config.BASE_URL+'unsubscribe/index.html#'+id+'+'+data.subscribers[i]
                    };
                    let mailOptions = {
                        from: 'MSF-REACH <admin@msf-reach.org>', // sender address -
                        to: data.subscribers[i],
                        subject: 'Event update notification',
                        template: 'event_update',
                        context: emContext
                    };

                    // send mail with defined transport object
                    logger.info('Sending sharing email notification');
                    transport.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            logger.error(error.message);
                            reject(error);
                        }
                        else
                        {
                            logger.info('Email %s sent: %s', info.messageId, info.response);

                        }
                    });
                }
            }
        }
        resolve(data); // pass contact data back out for next promise
    }),
    emailInviteToSubscribe: (data, id) => new Promise((resolve, reject) => {
        logger.debug(data);

        const smtpConfig = {
            host: 'email-smtp.us-west-2.amazonaws.com',
            port: 465,
            secure: true,
            requireTLS: true,
            auth: {
                user: config.SMTP_USER,
                pass: config.SMTP_PASS
            }
        };

        const transport = nodemailer.createTransport(smtpConfig);

        const options={
            viewEngine: {},
            viewPath: 'public/email-templates/',
            extName: '.hbs'
        };

        //attach the plugin to the nodemailer transporter
        transport.use('compile', hbs(options));

        data.invitees.forEach((invitee) =>{
            let emContext={
                inviterName: data.inviter.displayName,
                inviteeName: invitee.displayName,
                eventLink: config.BASE_URL+'events/?eventId='+id,
                loginLink: config.BASE_URL+'login'
            };
            let mailOptions = {
                from: 'MSF-REACH <admin@msf-reach.org>', // sender address -
                to: invitee.mail, // @mehrdadgit could use userPrincipalName but best to use mail which is present and may be different and preferred
                subject: 'Invitation to subscribe to an Event ',
                template: 'event_invite_subscribe',
                context: emContext
            };

            // send mail with defined transport object
            logger.info('Sending invite-to-subscribe-email to '+ invitee.mail );
            transport.sendMail(mailOptions, (error, info) => {
                if (error) {
                    logger.error(error.message);
                    reject(error);
                }
                else
                {
                    logger.info(`Email ${info.messageId} sent: ${info.response}`);

                }
            });

        });//for-each
        resolve(data);

    })


});
