from dataclasses import dataclass

from anthropic.types import Usage


@dataclass(frozen=True)
class ModelPricing:
    """USD per million tokens. Cache write is the 5-minute-TTL rate (1.25x input);
    cache read is 0.1x input."""

    input: float
    output: float
    cache_write_5m: float
    cache_read: float


# Source: https://platform.claude.com/docs/en/about-claude/pricing (May 2026).
PRICING: dict[str, ModelPricing] = {
    "claude-sonnet-4-6": ModelPricing(
        input=3.00, output=15.00, cache_write_5m=3.75, cache_read=0.30
    ),
    "claude-haiku-4-5": ModelPricing(
        input=1.00, output=5.00, cache_write_5m=1.25, cache_read=0.10
    ),
}

_TOKENS_PER_MILLION = 1_000_000


def usage_cost(model: str, usage: Usage) -> float:
    """Dollar cost of one Claude call.

    `usage.input_tokens` is the uncached remainder; cache writes and reads are
    billed separately at their own multipliers. Total prompt size =
    input_tokens + cache_creation_input_tokens + cache_read_input_tokens.
    """
    price = PRICING[model]
    cache_write = usage.cache_creation_input_tokens or 0
    cache_read = usage.cache_read_input_tokens or 0
    return (
        usage.input_tokens * price.input
        + cache_write * price.cache_write_5m
        + cache_read * price.cache_read
        + usage.output_tokens * price.output
    ) / _TOKENS_PER_MILLION
