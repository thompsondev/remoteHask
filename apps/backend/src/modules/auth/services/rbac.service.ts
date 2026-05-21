import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';

import { OrganizationMember } from '../../../database/entities/organization-member.entity';
import { Organization } from '../../../database/entities/organization.entity';
import { RolePermission } from '../../../database/entities/role-permission.entity';
import { OrganizationMemberStatus, type SystemRole } from '../../../database/enums';

export interface OrganizationMembershipSummary {
  id: string;
  name: string;
  slug: string;
  role: SystemRole;
  status: string;
}

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(OrganizationMember)
    private readonly memberRepository: Repository<OrganizationMember>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async getActiveMemberships(userId: string): Promise<OrganizationMembershipSummary[]> {
    const members = await this.memberRepository.find({
      where: {
        userId,
        status: OrganizationMemberStatus.ACTIVE,
        deletedAt: IsNull(),
      },
      relations: { organization: true },
    });

    return members
      .filter((member) => member.organization.deletedAt === null)
      .map((member) => ({
        id: member.organizationId,
        name: member.organization.name,
        slug: member.organization.slug,
        role: member.role,
        status: member.organization.status,
      }));
  }

  async getMembership(userId: string, organizationId: string): Promise<OrganizationMember | null> {
    return this.memberRepository.findOne({
      where: {
        userId,
        organizationId,
        status: OrganizationMemberStatus.ACTIVE,
        deletedAt: IsNull(),
      },
    });
  }

  async resolvePermissions(
    role: SystemRole,
    customPermissions: string[] | null,
  ): Promise<string[]> {
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { role },
    });

    const base = rolePermissions.map((entry) => entry.permissionId);
    const custom = customPermissions ?? [];

    return [...new Set([...base, ...custom])];
  }

  async getPermissionsForRoles(roles: SystemRole[]): Promise<string[]> {
    if (roles.length === 0) {
      return [];
    }

    const rows = await this.rolePermissionRepository.find({
      where: { role: In(roles) },
    });

    return [...new Set(rows.map((row) => row.permissionId))];
  }
}
