using Jobriq.SharedKernel;
using Shouldly;

namespace Jobriq.Application.Tests.Behaviors;

public sealed class ResultTests
{
    [Fact]
    public void Success_HasNoError()
    {
        Result result = Result.Success();

        result.IsSuccess.ShouldBeTrue();
        result.IsFailure.ShouldBeFalse();
        result.Error.ShouldBe(Error.None);
    }

    [Fact]
    public void Failure_CarriesError()
    {
        Error error = Error.Validation("invalid_request", "Bad input.");

        Result result = Result.Failure(error);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(error);
    }

    [Fact]
    public void SuccessOfT_ExposesValue()
    {
        Result<int> result = Result.Success(42);

        result.IsSuccess.ShouldBeTrue();
        result.Value.ShouldBe(42);
    }

    [Fact]
    public void FailureOfT_ThrowsWhenValueRead()
    {
        Result<int> result = Result.Failure<int>(Error.NotFound("missing", "Missing."));

        Should.Throw<InvalidOperationException>(() => _ = result.Value);
    }

    [Fact]
    public void ValidationError_CarriesFailures()
    {
        Error[] errors =
        [
            Error.Validation("invalid_request", "First."),
            Error.Validation("invalid_request", "Second.")
        ];

        ValidationError validationError = new(errors);

        validationError.Errors.ShouldBe(errors);
        validationError.Type.ShouldBe(ErrorType.Validation);
    }
}
