import { z } from "zod";
import { Prisma } from "@prisma/client";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";

const defaultGuestBookSelect = Prisma.validator<Prisma.GuessBookSelect>()({
  name: true,
  message: true,
  id: true,
  createdAt: true,
});

export const guessBookRouter = createTRPCRouter({
  postMessage: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.guessBook.create({
          data: {
            name: input.name,
            message: input.message,
          },
        });
      } catch (error) {
        console.log(error);
      }
    }),
  getAll: publicProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.prisma.guessBook.findMany({
        orderBy: {
          createdAt: "desc",
        },
        select: defaultGuestBookSelect,
      });
    } catch (error) {
      console.error(error);
    }
  }),
  deleteMessage: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      try {
        await ctx.prisma.guessBook.delete({
          where: {
            id,
          },
        });
      } catch (error) {}
    }),
});
