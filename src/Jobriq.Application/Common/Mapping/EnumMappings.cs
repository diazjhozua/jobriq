namespace Jobriq.Application.Common.Mapping;

public static class EnumMappings
{
    public static TTarget Map<TSource, TTarget>(TSource source)
        where TSource : struct, Enum
        where TTarget : struct, Enum =>
        Enum.Parse<TTarget>(source.ToString());

    public static TTarget? Map<TSource, TTarget>(TSource? source)
        where TSource : struct, Enum
        where TTarget : struct, Enum =>
        source is null ? null : Map<TSource, TTarget>(source.Value);
}
