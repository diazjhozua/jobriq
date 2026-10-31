namespace Jobriq.SharedKernel;

public enum ErrorType
{
    Failure = 0,
    Validation = 1,
    Problem = 2,
    NotFound = 3,
    Conflict = 4,
    Unavailable = 5,
    TooManyRequests = 6,
    BadGateway = 7
}
