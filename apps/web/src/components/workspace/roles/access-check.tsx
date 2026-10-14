"use client";

import { FC, useEffect, useState } from "react";

import { useTrpcClient } from "@zentro/api/react";
import { Badge } from "@zentro/ui/shadcn/badge";
import { Button } from "@zentro/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@zentro/ui/shadcn/card";
import { Label } from "@zentro/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";
import { toastError } from "@zentro/ui/index";

import { trpcResult } from "~/src/lib/trpc-result";

import { useCatalog } from "./use-catalog";

type Option = { id: string; label: string };
type Result = {
  allowed: boolean;
  baseRole: string | null;
  reasons: Array<{ kind: string; message: string }>;
};

const noneValue = "__none__";

export const AccessCheck: FC = () => {
  const trpc = useTrpcClient();
  const catalog = useCatalog();
  const [people, setPeople] = useState<Option[]>([]);
  const [projects, setProjects] = useState<Option[]>([]);
  const [teams, setTeams] = useState<Option[]>([]);
  const [userId, setUserId] = useState("");
  const [permission, setPermission] = useState("");
  const [projectId, setProjectId] = useState(noneValue);
  const [teamId, setTeamId] = useState(noneValue);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    void Promise.all([
      trpcResult(trpc.member.getMembers.query()),
      trpcResult(trpc.project.getProjectsByOrgId.query()),
      trpcResult(trpc.team.getAll.query()),
    ]).then(([members, projectList, teamList]) => {
      setPeople(
        (members.data ?? []).map((member) => ({
          id: member.userId,
          label: member.name || member.email,
        })),
      );
      setProjects(
        (projectList.data ?? []).map((project) => ({
          id: project.id,
          label: project.name,
        })),
      );
      setTeams(
        (teamList.data ?? []).map((team) => ({
          id: team.id,
          label: team.name,
        })),
      );
    });
  }, [trpc]);

  const check = async () => {
    const { data, error } = await trpcResult(
      trpc.permissions.explain.query({
        userId,
        permission,
        projectId: projectId === noneValue ? undefined : projectId,
        teamId: teamId === noneValue ? undefined : teamId,
      }),
    );

    if (error) {
      toastError(error.statusText, error.message);

      return;
    }

    setResult(data as Result);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl text-ink">Access check</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          See whether someone can do something, and which role, assignment or
          override decides it.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Member</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger aria-label="Member">
                <SelectValue placeholder="Choose a member" />
              </SelectTrigger>
              <SelectContent>
                {people.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Permission</Label>
            <Select value={permission} onValueChange={setPermission}>
              <SelectTrigger aria-label="Permission">
                <SelectValue placeholder="Choose a permission" />
              </SelectTrigger>
              <SelectContent>
                {(catalog ?? [])
                  .filter((entry) => entry.enabled)
                  .map((entry) => (
                    <SelectItem key={entry.key} value={entry.key}>
                      {entry.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Project (optional)</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger aria-label="Project">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={noneValue}>No project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Team (optional)</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger aria-label="Team">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={noneValue}>No team</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-4">
            <Button disabled={!userId || !permission} onClick={check}>
              Check access
            </Button>
          </div>
        </CardContent>
      </Card>

      {result ? (
        <Card data-testid="access-result">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Badge variant={result.allowed ? "default" : "destructive"}>
                {result.allowed ? "Allowed" : "Denied"}
              </Badge>
              {result.baseRole ? (
                <span className="text-sm font-normal text-muted-foreground">
                  Base role: {result.baseRole}
                </span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {result.reasons.map((reason, index) => (
                <li key={index}>{reason.message}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};
