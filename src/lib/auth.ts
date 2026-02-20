import { NextAuthOptions, Session } from "next-auth"
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
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }

      if (profile) {
        const twitterProfile = profile as { data: { username: string; name: string; profile_image_url?: string } };
        console.log("Profile recebido no JWT:", twitterProfile);
        token.username = twitterProfile.data.username;
        token.name = twitterProfile.data.name;
        token.picture = twitterProfile.data.profile_image_url;
      }

      console.log("Token após o JWT callback:", token);
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
        username: token.username,
        name: token.name,
        image: token.picture,
      };
      return session;
    },
  },
}
