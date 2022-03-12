import prisma from '../../../lib/prisma'
import { hashPassword } from '../../../lib/auth'
import jwt from 'jsonwebtoken';

export default async function (req, res) {
    const { token, password, email } = req.body
    const hashedPassword = await hashPassword(password)

    const emailTokenValid = await new Promise((resolve) => {
        jwt.verify(token, process.env.SECRET + email, (err) => {
            if (err) resolve(false)
            if (!err) resolve(true)
        })
    })



    if (emailTokenValid) {
        try {
            const updateUser = await prisma.user.update({
                where: {
                    token
                },
                data: {
                    password: hashedPassword,
                    token: null
                }
            })
            res.status(201);
            res.json({ updateUser });
        } catch (e) {
            res.status(500);
            res.json({ error: 'Ошибка при изменении пароля.' })
            console.log(e)
        } finally {
            await prisma.$disconnect();
        }
    } else {
        res.status(500);
        res.json({ error: 'Ошибка.' })
    }
}