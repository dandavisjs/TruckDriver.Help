import prisma from '../../../lib/prisma'
import NextAuth from 'next-auth'
import { verifyPassword } from '../../../lib/auth';
import CredentialsProvider from "next-auth/providers/credentials";
import jwt from 'jsonwebtoken';

const createOptions = (req) => ({
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        jwt: true,
        signingKey: process.env.JWT_SECRET
    },
    providers: [
        CredentialsProvider({
            async authorize(credentials) {
                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email
                    },
                    include: {
                        company: true
                    }
                })
                // User doesn't exist
                if (!user) {
                    throw new Error('Ошибвка авторизации! Повторите еще раз...')
                }

                // Password verification
                const isValid = await verifyPassword(credentials.password, user.password)

                // If password verification fails
                if (!isValid) {
                    throw new Error('Не удалось войти')
                } else if (!user.activated) {
                    // Else if users account isn't activated, but token is passed
                    const emailTokenValid = await new Promise((resolve) => {
                        // Token verification with JWT
                        jwt.verify(credentials.token, process.env.JWT_SECRET + credentials.email, (err) => {
                            if (err) resolve(false)
                            if (!err) resolve(true)
                        })
                    })
                    if (emailTokenValid) {
                        // If token verification passes, activate user
                        try {
                            await prisma.user.update({
                                where: {
                                    email: credentials.email
                                },
                                data: {
                                    activated: true
                                }
                            })

                        } catch (err) {
                            console.log("Unable to update activation");
                        }

                        try {
                            const user = await prisma.user.findUnique({
                                where: {
                                    email: credentials.email
                                }
                            })
                            return {
                                email: user.email,
                                activated: user.activated,
                                id: user.id
                            }
                        } catch (err) {

                            console.log("Unable to fetch user");
                        }

                    } else {
                        throw new Error("Необходимо верифицировать аккаунт")
                    }

                }
                // If user has a company, pass the company ID
                return user.company ? {
                    email: user.email,
                    activated: user.activated,
                    companyId: user.company.id,
                    id: user.id
                } : {
                    email: user.email,
                    activated: user.activated,
                    id: user.id,
                }
            }
        })
    ], callbacks: {
        jwt: async ({ token, user }) => {
            // If the URL path matches, update session object with company ID
            if (req.url === "/api/auth/session?update=") {
                const userRes = await prisma.user.findUnique({
                    where: {
                        email: token.email
                    },
                    include: {
                        company: true
                    }
                })
                // if user created a company, set the company ID
                userRes.company && (token.companyId = userRes.company.id)
            }

            if (user) {
                token.activated = user.activated
                token.id = user.id
                if (user.companyId && !token.companyId) {
                    token.companyId = user.companyId
                }
            }
            return token;
        },
        session: async ({ session, user, token }) => {
            if (token) {
                session.user.companyId = token.companyId
                session.user.id = token.id
                if (session.user.activated) {
                    session.user.activated = token.activated
                }
            }
            return session;
        }
    },
})

export default async (req, res) => {
    return NextAuth(req, res, createOptions(req));
};