/* eslint-disable prettier/prettier */
import { FastifyInstance } from 'fastify'
import axios from 'axios'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
export async function authRouter(app: FastifyInstance) {
  app.post('/register', async (request) => {
    const bodySchema = z.object({
      code: z.string(),
    })

    const{ code } = bodySchema.parse(request.body)

    const acessTokenResponse = await axios.post(
      'https://github.com/login/oauth/acess_token',
      null,
      {
        params: {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        },
        headers: {
          Accept: 'application/json',
        },
      }
    )

    const { acess_token } = acessTokenResponse.data

    const userResponse = await axios.get('https://api.github.com/user', {
      headers:{
        Authorization: `Beares ${acess_token}`,
      }
    })

    const userSchema = z.object({
      id: z.number(),
      login: z.string(),
      name: z.string(),
      avatar_url: z.string().url(),
    })

    const userInfo = userSchema.parse(userResponse.data)

    let user = await prisma.user.findUnique({
      where: {
        githubId: userInfo.id,
      }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          githubId: userInfo.id,
          login: userInfo.login,
          name: userInfo.name,
          avatarUrl: userInfo.avatar_url,
        },
      })
    }

    return {
      user,
    }
  })
}
