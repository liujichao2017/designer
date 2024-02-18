import { prisma } from '~/services/database.server';
import { ResultCode } from '../utils/result';
import { uploadImageContent } from './aws.server';

type BookMarkContent = { marks?: string; drawing?: string };

export default () => ({
  /**
   * 新增 book 的单页内容
   */
  create: async (
    bookId: number,
    projectId: number,
    userId: number,
    page: number,
    content: BookMarkContent,
  ) => {
    const { marks, drawing } = content;
    try {
      let imgUrl = '';
      if (drawing) {
        const resp = await uploadImageContent(drawing);
        if (!resp?.Location) return { code: ResultCode.AWS_ERROR };
        imgUrl = resp.Location;
      }
      const data = {
        data: JSON.stringify([]),
        drawing: '',
      };
      if (marks) data.data = marks;
      if (imgUrl) data.drawing = imgUrl;
      const book = await prisma.project_mark.create({
        data: {
          ...data,
          page,
          user_id: userId,
          project_id: projectId,
          project_list_id: bookId,
        },
      });
      return { code: ResultCode.OK, data: book };
    } catch (err) {
      return { code: ResultCode.DATABASE_ERROR };
    }
  },
  /**
   * 更新单页的 mark
   * @param id project_list id
   */
  updateById: async (id: number, content: BookMarkContent) => {
    const { marks, drawing } = content;

    try {
      let imgUrl = '';
      if (drawing) {
        const resp = await uploadImageContent(drawing);
        if (!resp?.Location) return { code: ResultCode.AWS_ERROR };
        imgUrl = resp.Location;
      }
      const data = {} as { data?: string; drawing?: string };
      if (marks) data.data = marks;
      if (imgUrl) data.drawing = imgUrl;

      const book = await prisma.project_mark.update({
        where: {
          id,
        },
        data,
      });
      return { code: ResultCode.OK, data: book };
    } catch (err) {
      return { code: ResultCode.DATABASE_ERROR };
    }
  },
  /**
   * 更新单页的 mark
   * @param id project_list id
   * @param marks marks文本（JSON.stringify 处理后)
   */
  updateMarksById: async (id: number, marks: string) => {
    try {
      const book = await prisma.project_mark.update({
        where: {
          id,
        },
        data: {
          data: marks,
        },
      });
      return { code: ResultCode.OK, data: book };
    } catch (err) {
      return { code: ResultCode.DATABASE_ERROR };
    }
  },
});
