import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 10000;

const resend = new Resend(process.env.RESEND_API_KEY);

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    cors({
        origin: [
            "https://arathi-kv.github.io",
            "http://localhost:5500",
            "http://127.0.0.1:5500"
        ],
        methods: ["POST", "GET"],
        allowedHeaders: ["Content-Type"]
    })
);

// --------------------------------------------------
// Health Check
// --------------------------------------------------

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Jet Shipping contact API is running."
    });
});

// --------------------------------------------------
// Contact Form
// --------------------------------------------------

app.post("/contact", async (req, res) => {

    try {

        const {
            name,
            email,
            subject,
            message,
            website
        } = req.body;

        // ------------------------------------------
        // Honeypot spam protection
        // ------------------------------------------

        if (website) {
            return res.status(400).json({
                success: false,
                message: "Invalid submission."
            });
        }

        // ------------------------------------------
        // Validation
        // ------------------------------------------

        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "Please complete all required fields."
            });
        }

        // ------------------------------------------
        // Length protection
        // ------------------------------------------

        if (
            name.length > 100 ||
            email.length > 150 ||
            subject.length > 200 ||
            message.length > 5000
        ) {
            return res.status(400).json({
                success: false,
                message: "One or more fields are too long."
            });
        }

        // ------------------------------------------
        // Email validation
        // ------------------------------------------

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        // ------------------------------------------
        // Basic HTML escaping
        // ------------------------------------------

        const escapeHTML = (text) => {
            return String(text)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        };

        const safeName = escapeHTML(name);
        const safeEmail = escapeHTML(email);
        const safeSubject = escapeHTML(subject);
        const safeMessage = escapeHTML(message)
            .replace(/\n/g, "<br>");

        // ------------------------------------------
        // Send email using Resend
        // ------------------------------------------

        const { data, error } = await resend.emails.send({

          from: "Jet Shipping Website <onboarding@resend.dev>",

            to: ["arathi@signroots.com"],

            replyTo: email,

            subject: `Website Enquiry: ${subject}`,

            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Jet Shipping Website Enquiry</title>
                </head>

                <body style="
                    margin:0;
                    padding:0;
                    background:#f5f5f5;
                    font-family:Arial, Helvetica, sans-serif;
                ">

                    <div style="
                        max-width:650px;
                        margin:30px auto;
                        background:#ffffff;
                        padding:30px;
                        border-radius:8px;
                    ">

                        <h2 style="
                            margin-top:0;
                            color:#222222;
                        ">
                            New Website Enquiry
                        </h2>

                        <p>
                            A new enquiry has been submitted through the
                            Jet Shipping website.
                        </p>

                        <hr>

                        <p>
                            <strong>Name:</strong><br>
                            ${safeName}
                        </p>

                        <p>
                            <strong>Email:</strong><br>
                            ${safeEmail}
                        </p>

                        <p>
                            <strong>Subject:</strong><br>
                            ${safeSubject}
                        </p>

                        <p>
                            <strong>Message:</strong><br>
                            ${safeMessage}
                        </p>

                        <hr>

                        <p style="
                            font-size:13px;
                            color:#777777;
                        ">
                            Sent from the Jet Shipping website contact form.
                        </p>

                    </div>

                </body>
                </html>
            `,

            text: `
New Jet Shipping Website Enquiry

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
            `
        });

        // ------------------------------------------
        // Resend error
        // ------------------------------------------

        if (error) {

            console.error("Resend error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to send your message. Please try again."
            });
        }

        console.log("Email sent:", data);

        // ------------------------------------------
        // Success
        // ------------------------------------------

        return res.status(200).json({
            success: true,
            message: "Thank you! Your message has been sent successfully."
        });

    } catch (error) {

        console.error("Server error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later."
        });
    }
});

// --------------------------------------------------
// Start Server
// --------------------------------------------------

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `Jet Shipping API running on port ${PORT}`
    );

});