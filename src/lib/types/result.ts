export type Ok<OkType> = {
  status: 'ok';
  value: OkType;
};

export type Err<ErrType> = {
  status: 'err';
  error: ErrType;
};

export type Result<OkType, ErrType> = Ok<OkType> | Err<ErrType>;

/**
 * Create a successful Result.
 */
export function ok<OkType>(value: OkType): Ok<OkType> {
  return {
    status: 'ok',
    value
  };
}

/**
 * Create a failed Result.
 */
export function err<ErrType>(error: ErrType): Err<ErrType> {
  return {
    status: 'err',
    error
  };
}

/**
 * Type guard for Ok variant.
 */
export function isOk<OkType, ErrType>(result: Result<OkType, ErrType>): result is Ok<OkType> {
  return result.status === 'ok';
}

/**
 * Type guard for Err variant.
 */
export function isErr<OkType, ErrType>(result: Result<OkType, ErrType>): result is Err<ErrType> {
  return result.status === 'err';
}
