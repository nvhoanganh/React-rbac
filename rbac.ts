/**
 * List of Roles
 */
export enum Role {
	Baseline = 0,
	Employee = 1,
	Admin = 2,
}

/**
 * Application level permission, e.g. each permission is linked to a button on the UI
 */
export const Static = {
	ViewNote: 'ViewNote',
	CreateNote: 'CreateNote',
	CreateTask: 'CreateTask',
	SearcNote: 'SearchNote',
	DeleteNote: 'DeleteNote',
	ExportNote: 'ExportNote',
};

/**
 * Row level permission
 */
export const Dynamic = {
	ReadOwnNote: {
		ReadOwnNote: ({ userId, ownerId }: CheckData) => {
			if (!userId || !ownerId) return false;
			return userId.toString() === ownerId.toString();
		},
	},

	ReadAllNote: {
		ReadOwnNote: ({ isAdmin }: CheckData) => {
			// Admin can read all notes
			if (isAdmin === true) return true;
		},
	},

	UpdateNote: {
		UpdateNote: ({ userId, ownerId, isAdmin }: CheckData) => {
			if (!userId || !ownerId) return false;

			// Update Own note
			if (userId.toString() === ownerId.toString()) return true;

			// Admin can update
			if (isAdmin === true) return true;

			return false;
		},
	},
	DeleteNote: {
		DeleteNote: ({ userId, ownerId, isAdmin }: CheckData) => {
			if (!userId || !ownerId) return false;

			// Only Admin can delete
			if (isAdmin === true) return true;

			return false;
		},
	},

	// ...add dynami permission
};

/**
 * Define what this role can do
 */
export const Base = {
	roleId: Role.Baseline,
	static: [
		Static.CreateNote,
		Static.ViewNote,
		Static.CreateTask,
		Static.SearcNote,
	],
	dynamic: {
		...Dynamic.DeleteNote,
		...Dynamic.UpdateNote,
		...Dynamic.ReadOwnNote,
	},
};

export const Employee = {
	// can do what Base can plus: Export notes
	static: [...Base.static, Static.ExportNote],
	dynamic: { ...Base.dynamic },
};

export const Admin = {
	// can do what Employee can plus Delete notes
	static: [...Employee.static, Static.DeleteNote],
	dynamic: { ...Employee.dynamic, ...Dynamic.ReadAllNote },
};

export const Rules = {
	[Role.Baseline]: Base,
	[Role.Employee]: Employee,
	[Role.Admin]: Admin,
};

export interface CheckData {
	userId?: number;
	ownerId?: number | string | undefined;
	userUnitId?: number;
	unitId?: number;
	isAdmin?: boolean;
	isPrivate?: boolean;
}

export const checkPermission = (
	role: Role,
	action: string,
	data: CheckData
): boolean => {
	// Base role = 0
	if (role === null || role === undefined) return false;
	const rules = Rules[role];

	if (!rules) {
		// no Rules defined for this role (e.g unknown Role?)
		return false;
	}

	const staticRules: string[] = rules.static;

	if (staticRules && staticRules.includes(action)) {
		// match static rule
		return true;
	}

	const dynamicRules = rules.dynamic as any;

	if (dynamicRules) {
		const condition = dynamicRules[action];
		if (!condition) {
			return false;
		}

		return condition(data);
	}
	return false;
};

/**
 * This is a React Component that you can use to wrap another component based on permission
 * Usage:
 * 
    <CanUser
      withRole={user.role}
      perform="UpdateData"
      data={{
              userId: user.id,
              onwerId: p3ost.ownerId
            }}
      yes={() => (
        <h2>User can do it</h2>
      )}
      no={() => <h2>User can't do it</h2>}
    />
 */

export interface CanUserProps {
	withRole: Role;
	perform: string;
	data: CheckData;
	yes?: any;
	no?: any;
}
export const CanUser = ({ withRole, perform, data, yes, no }: CanUserProps) => {
	const empty = () => null;
	const y = yes ? yes : empty;
	const n = no ? no : empty;
	return checkPermission(withRole, perform, data) ? y() : n();
};
