from langchain_core.documents import Document
from datetime import date, datetime

class dataloader:
    def __init__(self,data,user_id,report_id,user_name,created_at):
        self.data=data
        self.user_id=user_id
        self.report_id=report_id
        self.user_name=user_name
        self.created_at=created_at

    def _normalize_created_at(self):
        if isinstance(self.created_at, datetime):
            return self.created_at

        if isinstance(self.created_at, date):
            return datetime.combine(self.created_at, datetime.min.time())

        if isinstance(self.created_at, str):
            value = self.created_at.strip()

            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError:
                pass

            for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
                try:
                    return datetime.strptime(value, fmt)
                except ValueError:
                    continue

        return datetime.now()

    def load(self):
        created_at = self._normalize_created_at()
        data=Document(
            page_content=self.data,
            metadata={
                "Content_Type":"Medical_Report",
                "user_id":self.user_id,
                "report_id":str(self.report_id),
                "user_name":self.user_name,
                "year":created_at.year,
                "month":created_at.month,
                "day":created_at.day,
                "created_at":str(created_at)
            }
        )
        return data
