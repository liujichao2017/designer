import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useService } from '~/services/services.server';
import { ResultCode, fault } from '~/utils/result';
import { IdValidator } from '~/utils/validators';

export const loader = async (args: LoaderArgs) => {
  // const user = await isAuthenticated(args);
  // if (!user) return fault(ResultCode.PERMISSION_DENIED);
  const { request } = args;
  const { searchParams } = new URL(request.url);
  const loader = searchParams.get('loader');
  // const key = `notify::public::${user.id}`;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const projectListService = useService('projectList');
  switch (loader) {
    case 'book': {
      const result = IdValidator.safeParse(Object.fromEntries(searchParams));
      if (!result.success) return fault(ResultCode.FORM_INVALID);
      const book = await projectListService.getById(result.data.id);
      return json({ code: ResultCode.OK, book });
    }
  }
};

export const action = async (args: ActionArgs) => {};

export type ProjectLoader = typeof loader;
export type ProjectAction = typeof action;
