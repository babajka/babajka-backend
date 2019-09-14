import noop from 'lodash/noop';

import { User } from 'api/user';

export const retrieveMetadataTestingUser = async () => User.findOne({ email: 'admin@babajka.io' });

export const mockRes = { status: () => ({ json: noop }) };
