export type ContributionDay = {
  contributionCount: number;
  date: string;
  weekday: number;
};

export type ContributionWeek = {
  contributionDays: ContributionDay[];
  firstDay: string;
};

export type GitHubContributions = {
  from: string;
  to: string;
  totalContributions: number;
  restrictedContributionsCount: number;
  weeks: ContributionWeek[];
  username: string;
};

type GitHubGraphQLResponse = {
  data?: {
    user?: {
      contributionsCollection: {
        restrictedContributionsCount: number;
        contributionCalendar: {
          totalContributions: number;
          weeks: ContributionWeek[];
        };
      };
    };
  };
  errors?: { message: string }[];
};

const query = `
  query Contributions($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        restrictedContributionsCount
        contributionCalendar {
          totalContributions
          weeks {
            firstDay
            contributionDays {
              contributionCount
              date
              weekday
            }
          }
        }
      }
    }
  }
`;

function isoDateTime(date: Date): string {
  return date.toISOString();
}

export async function getGitHubContributions(): Promise<GitHubContributions | null> {
  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME ?? "ayatemp";

  if (!token) return null;

  const to = new Date();
  const from = new Date(to);
  from.setFullYear(from.getFullYear() - 1);

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: {
          login: username,
          from: isoDateTime(from),
          to: isoDateTime(to),
        },
      }),
      next: { revalidate: 60 * 60 * 6 },
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as GitHubGraphQLResponse;
    const collection = payload.data?.user?.contributionsCollection;

    if (!collection || payload.errors?.length) return null;

    return {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      totalContributions: collection.contributionCalendar.totalContributions,
      restrictedContributionsCount: collection.restrictedContributionsCount,
      weeks: collection.contributionCalendar.weeks,
      username,
    };
  } catch {
    return null;
  }
}
