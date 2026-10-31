using Jobriq.SharedKernel;

namespace Jobriq.Web.Extensions;

internal static class ResultExtensions
{
    public static IResult Match(
        this Result result,
        Func<IResult> onSuccess,
        Func<Result, IResult> onFailure) =>
        result.IsSuccess ? onSuccess() : onFailure(result);

    public static IResult Match<T>(
        this Result<T> result,
        Func<T, IResult> onSuccess,
        Func<Result<T>, IResult> onFailure) =>
        result.IsSuccess ? onSuccess(result.Value) : onFailure(result);
}
