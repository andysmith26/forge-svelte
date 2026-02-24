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

/**
 * Map over the Ok value, leaving Err untouched.
 */
export function map<OkType, ErrType, NewOk>(
  result: Result<OkType, ErrType>,
  fn: (value: OkType) => NewOk
): Result<NewOk, ErrType> {
  if (isOk(result)) {
    return ok(fn(result.value));
  }
  return result;
}

/**
 * Map over the Err value, leaving Ok untouched.
 */
export function mapErr<OkType, ErrType, NewErr>(
  result: Result<OkType, ErrType>,
  fn: (error: ErrType) => NewErr
): Result<OkType, NewErr> {
  if (isErr(result)) {
    return err(fn(result.error));
  }
  return result;
}

/**
 * Chain computations that return Results.
 * - If the current Result is Ok, run fn on its value.
 * - If it's Err, propagate the error.
 */
export function andThen<OkType, ErrType, NextOk>(
  result: Result<OkType, ErrType>,
  fn: (value: OkType) => Result<NextOk, ErrType>
): Result<NextOk, ErrType> {
  if (isOk(result)) {
    return fn(result.value);
  }
  return result;
}
