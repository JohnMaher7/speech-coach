import math

import pytest
from anthropic.types import Usage

from app.cost import usage_cost


def test_sonnet_cost_counts_cache_buckets_on_top_of_input_tokens():
    # input_tokens is the *uncached remainder*; cache write/read are billed separately.
    usage = Usage(
        input_tokens=1000,
        output_tokens=500,
        cache_creation_input_tokens=2000,
        cache_read_input_tokens=3000,
    )
    # (1000*3 + 2000*3.75 + 3000*0.30 + 500*15) / 1e6
    expected = (3000 + 7500 + 900 + 7500) / 1_000_000
    assert math.isclose(usage_cost("claude-sonnet-4-6", usage), expected)


def test_haiku_cheaper_than_sonnet_for_same_usage():
    usage = Usage(
        input_tokens=1000,
        output_tokens=500,
        cache_creation_input_tokens=0,
        cache_read_input_tokens=0,
    )
    # (1000*1 + 500*5) / 1e6
    assert math.isclose(usage_cost("claude-haiku-4-5", usage), 3500 / 1_000_000)
    assert usage_cost("claude-haiku-4-5", usage) < usage_cost("claude-sonnet-4-6", usage)


def test_no_tokens_costs_nothing():
    usage = Usage(
        input_tokens=0,
        output_tokens=0,
        cache_creation_input_tokens=None,
        cache_read_input_tokens=None,
    )
    assert usage_cost("claude-sonnet-4-6", usage) == 0.0


def test_unknown_model_raises():
    usage = Usage(input_tokens=10, output_tokens=5)
    with pytest.raises(KeyError):
        usage_cost("claude-imaginary-9", usage)
