import { prisma } from '~/services/database.server';
import { ResultCode } from '../utils/result';
import { uploadImageContent } from './aws.server';

export default () => ({
  updateById: async (id: number, drawing: string) => {
    try {
      const resp = await uploadImageContent(drawing);
      if (!resp?.Location) return { code: ResultCode.AWS_ERROR };
      const imgUrl = resp.Location;
      const book = await prisma.project_list_image.update({
        where: {
          id,
        },
        data: {
          img_url: imgUrl,
        },
      });
      return { code: ResultCode.OK, data: book };
    } catch (err) {
      return { code: ResultCode.DATABASE_ERROR };
    }
  },
});
