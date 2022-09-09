import { application, Request, Response } from "express";
import { prismaInstance } from "../../database/prismaClient";
// import { differenceInDays } from "date-fns";

const levelMaker = () => {
  let level = 0;
  let startLevel = new Date(2022, 2, 7);
  let endLevel = new Date(2022, 8, 22);
  // const between = differenceInDays(new Date(), startLevel);
  let timeNow = new Date(2022, 4, 1).getHours();
  // let rex: number = between * 24 + timeNow;
  // level = Math.trunc(rex / 48);
  // let exp = rex % 48;
  if (endLevel < new Date()) {
    level = 100;
  }
  return {
    level,
    // exp,
  };
};

const create = async (request: Request, response: Response) => {
  const { email, role, name, surname, main, avatar } = request.body;
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
        main,
        role,
        avatar: avatar || `https://ui-avatars.com/api/?name=${name}+${surname}`,
      },
    });
    return response
      .status(200)
      .json({ user, message: "Usuário criado com sucesso" });
  } catch (error) {
    return response
      .status(400)
      .json({ message: "Algo de errado aconteceu.", error: error.message });
  }
};

const getAll = async (request: Request, response: Response) => {
  try {
    const { main }: { main?: "ENGINEERING" | "DESIGN" | "PRODUCT" } =
      request.query;

    const users = await prismaInstance.user.findMany({
      where: { main },
    });
    const userWithLevel = users.map((item) => {
      return {
        ...item,
        ...levelMaker(),
      };
    });
    return response.status(200).json(userWithLevel);
  } catch (error) {
    return response
      .status(400)
      .json({ message: "Algo de errado aconteceu.", error: error.message });
  }
};

const getUserByEmail = async (request: Request, response: Response) => {
  const { email } = request.params;
  console.log({ params: request.params });

  try {
    const user = await prismaInstance.user.findUnique({
      where: { email },
      include: {
        badges: true,
        profile: true,
      },
    });

    const userWithLevel = { ...user, ...levelMaker() };

    return response.status(200).json({ userWithLevel });
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
      main,
      avatar,
    }: {
      email: string;
      role?: "STUDENT" | "EMBASSADOR" | "RETHINKER";
      name?: string;
      surname?: string;
      avatar?: string;
      main?: "ENGINEERING" | "DESIGN" | "PRODUCT";
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
        main,
        // avatar,
        // avatar,
      },
    });

    return response.status(200).json({ updatedUser });
  } catch (error) {
    return response
      .status(400)
      .json({ message: "Algo de errado aconteceu.", error });
  }
};

const createWatched = async (request: Request, response: Response) => {
  const { email } = request.params;
  const { watchedId } = request.body;

  try {
    const user = await prismaInstance.user.findUnique({
      where: { email },
      select: {
        watched: true,
      },
    });

    user?.watched.push(watchedId);

    const userUpdated = await prismaInstance.user.update({
      where: { email },
      data: {
        watched: user?.watched,
      },
    });

    return response.status(200).json(userUpdated);
  } catch (error) {
    return response
      .status(400)
      .json({ message: "Algo de errado aconteceu.", error });
  }
};

const getWatched = async (request: Request, response: Response) => {
  const { email } = request.params;
  try {
    const user = await prismaInstance.user.findFirst({
      where: { email },
    });

    const { trailId }: { trailId?: string } = request.query;
    const courses = await prismaInstance.course.findMany({
      where: { trailId },
      // select: {
      //   courseStyle: true,
      //   trail: true,
      //   modules: {
      //     include: {
      //       lessons: true,
      //     },
      //   },
      // },
      include: {
        trail: true,
        modules: {
          include: {
            lessons: true,
          },
        },
      },
    });

    const maxLessons = courses.map((course) => {
      const lessonsLength: any = [];
      const userLessonsLength: any = [];

      course.modules.map((module) => {
        module.lessons.map((lesson) => {
          if (user?.watched.includes(lesson.id)) {
            userLessonsLength.push(lesson.id);
          }
          lessonsLength.push(lesson.id);
        });
      });

      let completed: boolean = false;
      if (
        lessonsLength.length !== 0 &&
        lessonsLength.length == userLessonsLength.length
      ) {
        completed = true;
      }

      return {
        courseStyle: course.courseStyle,
        lessonsLength: lessonsLength.length,
        userLessonsLength: userLessonsLength.length,
        completed,
        name: course.name,
        id: course.id,
        trail: course.trail,
      };
    });

    return response.status(200).json({ maxLessons, user });
  } catch (error) {
    return response
      .status(400)
      .json({ message: "Algo de errado aconteceu.", error });
  }
};

const getWatchedList = async (request: Request, response: Response) => {
  const { email } = request.params;
  try {
    const watchedList = await prismaInstance.user.findUnique({
      where: { email },
      select: {
        watched: true,
      },
    });

    return response.status(200).json(watchedList);
  } catch (error) {
    return response
      .status(400)
      .json({ message: "Algo de errado aconteceu.", error });
  }
};

const getProfileByUserId = async (request: Request, response: Response) => {
  const { id } = request.params;
  try {
    const profile = await prismaInstance.profile.findUnique({
      where: { userId: id },
      include: {
        user: true,
      },
    });
    return response.status(200).json({ profile });
  } catch (error) {
    return response
      .status(400)
      .json({ message: "Algo de errado aconteceu.", error });
  }
};

const updateLessonsWatched = async (request: Request, response: Response) => {
  const { watched } = request.body;

  const { email } = request.params;
  try {
    const user = await prismaInstance.user.update({
      where: { email },
      data: {
        watched,
      },
    });
    return response
      .status(200)
      .json({ user, message: "Lições completadas pelo usuário!" });
  } catch (error) {
    return response
      .status(400)
      .json({ message: "Algo de errado aconteceu.", error: error.message });
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

const getCoursesCompletedUser = async (
  request: Request,
  response: Response
) => {
  const { email, trailId } = request.body;

  const courses = await prismaInstance.trail.findFirst({
    where: { id: trailId },
    select: {
      course: {
        include: {
          modules: {
            select: {
              lessons: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const user = await prismaInstance.user.findFirst({
    where: { email },
    include: {
      badges: true,
      profile: true,
    },
  });

  let courseBegining = false;
  let courseIsCompleted = true;
  let coursecompleted = 0;
  let badgeCompleted = true;

  const data = courses?.course.map((course) => {
    courseBegining = false;
    courseIsCompleted = true;
    coursecompleted = 0;

    course.modules.map((module) => {
      module.lessons.map((lesson) => {
        if (user?.watched.includes(lesson.id)) {
          courseBegining = true;
        } else {
          courseIsCompleted = false;
        }
        // if (!user?.watched.includes(lesson.id)) {
        //   courseIsCompleted = false;
        // } else {
        //   courseBegining = true;
        // }
      });
    });
    if (courseIsCompleted === true) coursecompleted = 1;
    else if (courseBegining) coursecompleted = 2;
    else coursecompleted = 3;

    return { ...course, coursecompleted };
  });
  return response.status(200).json({ data, user });
};

export default {
  create,
  profile,
  getUserByEmail,
  createWatched,
  getWatched,
  getWatchedList,
  getProfileByUserId,
  getAll,
  update,
  levelMaker,
  updateLessonsWatched,
  // updateLessonsWatched,
  getCoursesCompletedUser,
};
