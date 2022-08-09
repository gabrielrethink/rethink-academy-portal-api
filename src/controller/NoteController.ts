import { Request, Response } from "express";
import { prismaInstance } from "../../database/prismaClient";

const create = async (request: Request, response: Response) => {
  const { email } = request.params;
  const {
    title,
    content,
    categories,
  }: { title: string; content: string; categories: boolean[] } = request.body;
  try {
    const userByEmail = await prismaInstance.user.findFirst({
      where: { email },
    });

    if (!userByEmail) throw new Error("Usuário não encontrado");

    const note = await prismaInstance.note.create({
      data: {
        userId: userByEmail.id,
        title,
        content,
        categories: {
          ...categories,
        },
      },
    });
    console.log({ note });

    return response
      .status(200)
      .json({ note, message: "Nota criada com sucesso." });
  } catch (error) {
    return response
      .status(400)
      .json({ message: "Algo de errado aconteceu.", error });
  }
};

const getNotesByUser = async (request: Request, response: Response) => {
  try {
    const { email } = request.params;
    const userByEmail = await prismaInstance.user.findFirst({
      where: { email },
    });

    if (!userByEmail) throw new Error("Usuário não encontrado");

    const notes = await prismaInstance.note.findMany({
      where: { userId: userByEmail.id },
    });

    const notesFormated = notes.map((note) => {
      return {
        ...note,
        categories: [
          note.categories!["0"],
          note.categories!["1"],
          note.categories!["2"],
        ],
      };
    });

    return response.status(200).json({ user: userByEmail, notesFormated });
  } catch (error) {
    return response
      .status(400)
      .json({ message: "Algo de errado aconteceu.", error });
  }
};

export default { create, getNotesByUser };
