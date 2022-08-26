import { Request, Response } from "express";
import { prismaInstance } from "../../database/prismaClient";

const create = async (request: Request, response: Response) => {
  const { email, role, name, surname } = request.body;
  try {
    if (!email) {
      return response
        .status(400)
        .json({ message: "Campo email é obrigatorio." });
    }
    const user = await prismaInstance.user.create({
      data: {
        name,
        surname,
        email,
        role,
      },
    });
    return response
      .status(200)
      .json({ user, message: "Usuário criado com sucesso" });
  } catch (error) {
    return response
      .status(400)
      .json({ message: "Algo de errado aconteceu.", error });
  }
};

const profile = async (request: Request, response: Response) => {
  const { userId, social, bio, avatar } = request.body;
  try {
    await prismaInstance.profile.upsert({
      where: { userId },
      create: {
        userId,
        bio,
        avatar,
        social: {
          ...social,
        },
      },
      update: {
        userId,
        bio,
        avatar,
        social: {
          ...social,
        },
      },
    });
    return response.status(200).json({
      message: `Perfil criado com sucesso para o userid: ${userId}`,
    });
  } catch (error) {
    return response
      .status(400)
      .json({ message: "Algo de errado aconteceu.", error });
  }
};

const getAll = async (request: Request, response: Response) => {
  try {
    const { title }: { title?: "ENGINEERING" | "DESIGN" | "PRODUCT" } =
      request.query;

    const users = await prismaInstance.user.findMany({
      where: { title },
      include: {
        profile: true,
      },
    });
    return response.status(200).json(users);
  } catch (error) {
    return response
      .status(400)
      .json({ message: "Algo de errado aconteceu.", error });
  }
};

const getUserByEmail = async (request: Request, response: Response) => {
  const { email } = request.params;

  try {
    console.log({ email });
    const user = await prismaInstance.user.findFirst({
      where: { email: "gabriel.gomes@rethink.dev" },
      include: {
        profile: true,
      },
    });
    console.log("{ user }");
    console.log({ user });

    return response.status(200).json(user);
  } catch (error) {
    return response
      .status(400)
      .json({ message: "Algo de errado aconteceu.", error });
  }
};

const update = async (request: Request, response: Response) => {
  try {
    const {
      role,
      name,
      surname,
      title,
    }: {
      email: string;
      role?: "STUDENT" | "EMBASSADOR" | "RETHINKER";
      name?: string;
      surname?: string;
      title?: "ENGINEERING" | "DESIGN" | "PRODUCT";
    } = request.body;
    const email: string = request.params.email;
    const updatedUser = await prismaInstance.user.update({
      where: {
        email,
      },
      data: {
        role,
        name,
        surname,
        title,
      },
    });
    return response.status(200).json({ updatedUser });
  } catch (error) {
    return response
      .status(400)
      .json({ message: "Algo de errado aconteceu.", error });
  }
};

export default { create, profile, getUserByEmail, getAll, update };
