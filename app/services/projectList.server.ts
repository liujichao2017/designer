import { prisma } from '~/services/database.server';

export default () => ({
  getList: async () => {
    return await prisma.project_list.findMany({
      select: {
        id: true,
        project_name: true,
        created_at: true,
        owner: {
          select: {
            name: true,
          },
        },
        pages: true,
      },
      orderBy: { id: "desc" }
    });
  },
  deleteById: async (id: number) => {
    // return await prisma.project_list.delete({
    //   where: { id },
    // });
    return await prisma.$executeRaw`DELETE FROM project WHERE id=${id}`
  },
  renameById: async (id: number, project_name: string) => {
    return await prisma.project.update({
      where: { id },
      data: { project_name },
    });
  },

  /**
   * 根据 project_list id 获取详情（包含关联的 marks）
   * @param id project_list id
   */
  getById: async (id: number) => {
    const book = await prisma.project_list.findUnique({
      where: { id },
      select: {
        id: true,
        project_name: true,
        pdf_url: true,
        type: true,
        marks: true,
        created_at: true,
        pages: true,
      },
    });
    return book;
  },
});
