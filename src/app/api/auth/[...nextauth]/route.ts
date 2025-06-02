import NextAuth, { NextAuthOptions, Session } from "next-auth"
import { JWT } from "next-auth/jwt"
import TwitterProvider from "next-auth/providers/twitter"
interface CustomSession extends Session {
  accessToken?: string
}

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
      profile(profile) {
        return {
          id: profile.data.id as string,
          name: profile.data.name,
          username: profile.data.username,
          image: profile.data.profile_image_url,
        }
      },
      authorization: {
        params: {
          scope: "tweet.read tweet.write users.read offline.access media.write",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account, profile }: { token: JWT; account?: any; profile?: any }) {
      if (account) {
        token.accessToken = account.access_token;
      }

      if (profile) {
        console.log("Profile recebido no JWT:", profile); // Log para depuração
        token.username = profile.data.username; // Certifique-se de que o campo correto está sendo usado
        token.name = profile.data.name;
        token.picture = profile.data.profile_image_url;
      }

      console.log("Token após o JWT callback:", token); // Log para verificar o token
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: CustomSession;
      token: JWT;
    }) {
      session.accessToken = token.accessToken as string;
      session.user = {
        ...session.user,
        username: token.username, // Agora o username estará disponível no token
        name: token.name, // Adicione o nome, se necessário
        image: token.picture, // Adicione a imagem, se necessário
      };
      return session;
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
