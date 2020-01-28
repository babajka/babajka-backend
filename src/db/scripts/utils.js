import noop from 'lodash/noop';

import { User } from 'api/user';

import { userEmail } from 'utils/args';

export const retrieveMetadataTestingUser = async () => User.findOne({ email: userEmail });

export const mockRes = { status: () => ({ json: noop }) };
