MIN_DURATION_SEC = 10.0
MAX_DURATION_SEC = 25 * 60.0
MIN_WORDS = 5
MAX_UPLOAD_BYTES = 250 * 1024 * 1024


class AnalysisError(Exception):
    """Expected failure with a user-safe message.

    Anything raised as AnalysisError is shown to the user verbatim. Anything
    else gets a generic message and a server-side log entry.
    """

    def __init__(self, user_message: str) -> None:
        super().__init__(user_message)
        self.user_message = user_message
